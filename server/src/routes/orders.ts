import { FastifyInstance } from 'fastify';
import prisma from '../db';

export default async function ordersRoutes(fastify: FastifyInstance) {
  // Create order (authenticated)
  fastify.post('/orders', { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = request.body as any;
    const { items, total, paymentMethod, paymentRef, tendered, change } = body;
    const cashier = (request.user as any)?.name || (request.user as any)?.email || 'system';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({ error: 'items array required and must not be empty' });
    }
    if (typeof total !== 'number' || total <= 0) {
      return reply.code(400).send({ error: 'total required and must be greater than 0' });
    }
    if (!paymentMethod || !['Cash', 'GCash', 'Card'].includes(paymentMethod)) {
      return reply.code(400).send({ error: 'paymentMethod required (Cash, GCash, or Card)' });
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            total,
            payment: paymentMethod,
            paymentRef: paymentRef || null,
            tendered: tendered || null,
            change: change || null,
            cashier,
          },
        });

        for (const it of items) {
          if (!it.productId || typeof it.quantity !== 'number' || typeof it.price !== 'number') {
            throw new Error('Item requires productId, quantity, and price');
          }
          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: it.productId,
              quantity: it.quantity,
              price: it.price,
            },
          });
          const p = await tx.product.findUnique({ where: { id: it.productId } });
          if (!p) throw new Error('Product not found');
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: p.stock - it.quantity },
          });
        }

        await tx.auditLog.create({
          data: {
            user: cashier || 'system',
            action: 'SALE',
            details: `Order #${created.id} • Items: ${items.length} • Total: ₱${total}`,
          },
        });

        return created;
      });

      return order;
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Get all orders with pagination
  fastify.get('/orders', async (request, reply) => {
    const query = request.query as any;
    const { skip = 0, take = 50, cashier, startDate, endDate } = query;

    const where: any = {};
    if (cashier) where.cashier = { contains: cashier };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    try {
      const list = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
        skip: Number(skip),
        take: Math.min(Number(take), 100),
      });

      const total = await prisma.order.count({ where });

      return { orders: list, total, skip: Number(skip), take: Number(take) };
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Get order by ID
  fastify.get('/orders/:id', async (request, reply) => {
    const id = Number((request.params as any).id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) return reply.code(404).send({ error: 'Order not found' });
    return order;
  });

  // Get sales summary (daily, by cashier, etc.)
  fastify.get('/orders/summary/sales', async (request, reply) => {
    const query = request.query as any;
    const { startDate, endDate } = query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({ where });

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const byPayment: Record<string, number> = {};
    const byCashier: Record<string, number> = {};

    orders.forEach((order) => {
      byPayment[order.payment] = (byPayment[order.payment] || 0) + order.total;
      byCashier[order.cashier || 'system'] = (byCashier[order.cashier || 'system'] || 0) + order.total;
    });

    return {
      totalOrders: orders.length,
      totalSales,
      byPayment,
      byCashier,
    };
  });
}
