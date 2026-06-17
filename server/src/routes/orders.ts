import { FastifyInstance } from 'fastify';
import prisma from '../db';

export default async function ordersRoutes(fastify: FastifyInstance) {
  fastify.post('/orders', { preHandler: fastify.authenticate }, async (request, reply) => {
    const body = request.body as any;
    const { items, total, paymentMethod, paymentRef, tendered, change } = body;
    const cashier = (request.user as any)?.name || (request.user as any)?.email || 'system';
    try {
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({ data: { total, payment: paymentMethod, paymentRef, tendered, change, cashier } });
        for (const it of items) {
          await tx.orderItem.create({ data: { orderId: created.id, productId: it.productId, quantity: it.quantity, price: it.price } });
          const p = await tx.product.findUnique({ where: { id: it.productId } });
          if (!p) throw new Error('Product not found');
          await tx.product.update({ where: { id: it.productId }, data: { stock: p.stock - it.quantity } });
        }
        await tx.auditLog.create({ data: { user: cashier || 'system', action: 'SALE', details: `Order #${created.id} • ₱${total}` } });
        return created;
      });
      return order;
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  fastify.get('/orders', async (request, reply) => {
    const list = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } });
    return list;
  });
}
