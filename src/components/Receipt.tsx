import { Transaction } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";

type Props = {
  order: Transaction | null;
  open: boolean;
  onClose: () => void;
  storeName?: string;
  storeAddress?: string;
  storeTin?: string;
};

export const Receipt = ({
  order,
  open,
  onClose,
  storeName = "Sari-Sari Mart",
  storeAddress = "123 Rizal St., Manila, Philippines",
  storeTin = "TIN: 000-123-456-000",
}: Props) => {
  if (!order) return null;

  const handlePrint = () => {
    const node = document.getElementById("receipt-printable");
    if (!node) return;
    const w = window.open("", "_blank", "width=380,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt #${order.id}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: 'Courier New', monospace; font-size: 12px; color:#000; }
        .center { text-align:center; }
        .row { display:flex; justify-content:space-between; }
        .bold { font-weight:bold; }
        .dashed { border-top:1px dashed #000; margin:6px 0; }
        .lg { font-size:14px; }
        h2 { margin: 2px 0; font-size:16px; }
        .small { font-size:10px; }
      </style></head><body>${node.innerHTML}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 250);
  };

  const date = new Date(order.date);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <div className="p-4 max-h-[70vh] overflow-y-auto bg-white text-black">
          <div id="receipt-printable" className="font-mono text-[12px] leading-tight">
            <div className="center text-center">
              <h2 className="text-base font-bold m-0">{storeName}</h2>
              <div className="small text-[10px]">{storeAddress}</div>
              <div className="small text-[10px]">{storeTin}</div>
            </div>
            <div className="dashed border-t border-dashed border-black my-2" />
            <div className="row flex justify-between">
              <span>Receipt #</span><span className="bold font-bold">{order.id}</span>
            </div>
            <div className="row flex justify-between">
              <span>Date</span><span>{date.toLocaleString()}</span>
            </div>
            <div className="row flex justify-between">
              <span>Cashier</span><span>{order.cashier}</span>
            </div>
            <div className="dashed border-t border-dashed border-black my-2" />

            {order.items.map((i) => (
              <div key={i.productId} className="mb-1">
                <div>{i.name}</div>
                <div className="row flex justify-between">
                  <span>  {i.quantity} x {i.price.toFixed(2)}</span>
                  <span>{(i.price * i.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}

            <div className="dashed border-t border-dashed border-black my-2" />
            {order.subtotal !== undefined && (
              <div className="row flex justify-between">
                <span>Subtotal</span><span>₱{order.subtotal.toFixed(2)}</span>
              </div>
            )}
            {order.vat !== undefined && (
              <div className="row flex justify-between">
                <span>VAT (12%)</span><span>₱{order.vat.toFixed(2)}</span>
              </div>
            )}
            <div className="row flex justify-between bold font-bold lg text-sm mt-1">
              <span>TOTAL</span><span>₱{order.total.toFixed(2)}</span>
            </div>
            <div className="dashed border-t border-dashed border-black my-2" />
            <div className="row flex justify-between">
              <span>Payment</span><span>{order.paymentMethod || "Cash"}</span>
            </div>
            {order.tendered !== undefined && (
              <>
                <div className="row flex justify-between">
                  <span>Tendered</span><span>₱{order.tendered.toFixed(2)}</span>
                </div>
                <div className="row flex justify-between">
                  <span>Change</span><span>₱{(order.change ?? 0).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="dashed border-t border-dashed border-black my-2" />
            <div className="center text-center small text-[10px]">
              Thank you for shopping!<br />
              Please come again.
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-3 border-t bg-muted/30">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
