import { FastifyInstance } from 'fastify';
import prisma from '../db';

export default async function auditRoutes(fastify: FastifyInstance) {
  // Get audit logs with filtering
  fastify.get('/audit-logs', { preHandler: fastify.authenticate }, async (request, reply) => {
    const query = request.query as any;
    const { user, action, skip = 0, take = 50, startDate, endDate } = query;

    const where: any = {};
    if (user) where.user = { contains: user };
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    try {
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Math.min(Number(take), 100),
      });

      const total = await prisma.auditLog.count({ where });

      return { logs, total, skip: Number(skip), take: Number(take) };
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Get single audit log
  fastify.get('/audit-logs/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log) return reply.code(404).send({ error: 'Audit log not found' });
    return log;
  });

  // Get audit summary (stats by action)
  fastify.get('/audit-logs/summary/stats', { preHandler: fastify.authenticate }, async (request, reply) => {
    const query = request.query as any;
    const { startDate, endDate } = query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({ where });

    const stats: Record<string, number> = {};
    logs.forEach((log) => {
      stats[log.action] = (stats[log.action] || 0) + 1;
    });

    return stats;
  });
}
