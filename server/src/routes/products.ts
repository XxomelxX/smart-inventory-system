import { FastifyInstance } from 'fastify';
import prisma from '../db';

export default async function productsRoutes(fastify: FastifyInstance) {
  fastify.get('/products', async (request, reply) => {
    const items = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    return items;
  });

  fastify.get('/products/:id', async (request, reply) => {
    const id = Number((request.params as any).id);
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return reply.code(404).send({ error: 'Not found' });
    return p;
  });

  fastify.post('/products', async (request, reply) => {
    const body = request.body as any;
    const created = await prisma.product.create({ data: body });
    return created;
  });

  // deduct stock endpoint used by POS
  fastify.post('/products/deduct', async (request, reply) => {
    const items = request.body as { productId: number; quantity: number }[];
    const tx = await prisma.$transaction(async (tx) => {
      for (const it of items) {
        const p = await tx.product.findUnique({ where: { id: it.productId } });
        if (!p) throw new Error(`Product ${it.productId} not found`);
        if (p.stock < it.quantity) throw new Error(`Insufficient stock for ${p.name}`);
        await tx.product.update({ where: { id: it.productId }, data: { stock: p.stock - it.quantity } });
      }
      return true;
    });
    return { success: tx };
  });
}
