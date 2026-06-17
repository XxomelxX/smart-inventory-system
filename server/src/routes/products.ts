import { FastifyInstance } from 'fastify';
import prisma from '../db';

export default async function productsRoutes(fastify: FastifyInstance) {
  // Get all products
  fastify.get('/products', async (request, reply) => {
    const query = request.query as any;
    const { skip = 0, take = 100 } = query;

    const items = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      skip: Number(skip),
      take: Math.min(Number(take), 100),
    });
    const total = await prisma.product.count();
    return { items, total, skip: Number(skip), take: Number(take) };
  });

  // Get product by ID
  fastify.get('/products/:id', async (request, reply) => {
    const id = Number((request.params as any).id);
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return reply.code(404).send({ error: 'Product not found' });
    return p;
  });

  // Search products by name or barcode
  fastify.get('/products/search/:query', async (request, reply) => {
    const q = (request.params as any).query?.toLowerCase() || '';
    const items = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { barcode: { contains: q } },
        ],
      },
      orderBy: { name: 'asc' },
    });
    return items;
  });

  // Create product (admin only)
  fastify.post('/products', { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });

    const body = request.body as any;
    const { sku, name, price, stock = 0, barcode } = body;

    if (!sku || !name || typeof price !== 'number') {
      return reply.code(400).send({ error: 'sku, name, and price required' });
    }

    try {
      const created = await prisma.product.create({
        data: { sku, name, price, stock, barcode },
      });
      return created;
    } catch (err: any) {
      if (err.code === 'P2002') return reply.code(400).send({ error: 'SKU already exists' });
      return reply.code(400).send({ error: err.message });
    }
  });

  // Update product (admin only)
  fastify.put('/products/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });

    const id = Number((request.params as any).id);
    const body = request.body as any;
    const { sku, name, price, stock, barcode } = body;

    const data: any = {};
    if (sku) data.sku = sku;
    if (name) data.name = name;
    if (typeof price === 'number') data.price = price;
    if (typeof stock === 'number') data.stock = stock;
    if (barcode !== undefined) data.barcode = barcode;

    try {
      const updated = await prisma.product.update({ where: { id }, data });
      return updated;
    } catch (err: any) {
      if (err.code === 'P2002') return reply.code(400).send({ error: 'SKU already exists' });
      if (err.code === 'P2025') return reply.code(404).send({ error: 'Product not found' });
      return reply.code(400).send({ error: err.message });
    }
  });

  // Delete product (admin only)
  fastify.delete('/products/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });

    const id = Number((request.params as any).id);

    try {
      await prisma.product.delete({ where: { id } });
      return { success: true };
    } catch (err: any) {
      if (err.code === 'P2025') return reply.code(404).send({ error: 'Product not found' });
      return reply.code(400).send({ error: err.message });
    }
  });

  // Adjust stock (admin only)
  fastify.post('/products/:id/adjust-stock', { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });

    const id = Number((request.params as any).id);
    const body = request.body as any;
    const { quantity, reason = 'Manual adjustment' } = body;

    if (typeof quantity !== 'number') {
      return reply.code(400).send({ error: 'quantity required and must be a number' });
    }

    try {
      const p = await prisma.product.findUnique({ where: { id } });
      if (!p) return reply.code(404).send({ error: 'Product not found' });

      const newStock = p.stock + quantity;
      if (newStock < 0) return reply.code(400).send({ error: 'Insufficient stock' });

      const updated = await prisma.product.update({
        where: { id },
        data: { stock: newStock },
      });

      // Log audit
      await prisma.auditLog.create({
        data: { user: user.email, action: 'STOCK_ADJUST', details: `${p.name} • Qty: ${quantity} • Reason: ${reason}` },
      });

      return updated;
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Deduct stock endpoint used by POS
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

  // Get low stock products
  fastify.get('/products/low-stock/list', async (request, reply) => {
    const query = request.query as any;
    const { threshold = 10 } = query;

    const items = await prisma.product.findMany({
      where: { stock: { lte: Number(threshold) } },
      orderBy: { stock: 'asc' },
    });
    return items;
  });
}
