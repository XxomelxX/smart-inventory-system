import { FastifyInstance } from 'fastify';
import prisma from '../db';
import bcrypt from 'bcryptjs';

export default async function usersRoutes(fastify: FastifyInstance) {
  // Create user (admin only)
  fastify.post('/users', { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });

    const body = request.body as any;
    const { email, name, password, role = 'cashier' } = body;

    if (!email || !password) return reply.code(400).send({ error: 'email and password required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply.code(400).send({ error: 'invalid email' });
    if (password.length < 6) return reply.code(400).send({ error: 'password must be at least 6 characters' });

    try {
      const hash = await bcrypt.hash(password, 10);
      const created = await prisma.user.create({
        data: { email, name: name || email.split('@')[0], passwordHash: hash, role },
      });
      return { id: created.id, email: created.email, name: created.name, role: created.role };
    } catch (err: any) {
      if (err.code === 'P2002') return reply.code(400).send({ error: 'Email already exists' });
      return reply.code(400).send({ error: err.message });
    }
  });

  // List all users (admin only)
  fastify.get('/users', { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });

    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  });

  // Get user by ID (own profile or admin)
  fastify.get('/users/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const authUser = request.user as any;
    const targetId = Number((request.params as any).id);

    if (authUser.sub !== targetId && authUser.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) return reply.code(404).send({ error: 'User not found' });
    return user;
  });

  // Update user (own profile or admin)
  fastify.put('/users/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const authUser = request.user as any;
    const targetId = Number((request.params as any).id);
    const body = request.body as any;
    const { name, role } = body;

    if (authUser.sub !== targetId && authUser.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const data: any = {};
    if (name) data.name = name;
    if (role && authUser.role === 'admin') data.role = role;

    try {
      const updated = await prisma.user.update({
        where: { id: targetId },
        data,
        select: { id: true, email: true, name: true, role: true },
      });
      return updated;
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Change password (own or admin)
  fastify.post('/users/:id/change-password', { preHandler: fastify.authenticate }, async (request, reply) => {
    const authUser = request.user as any;
    const targetId = Number((request.params as any).id);
    const body = request.body as any;
    const { currentPassword, newPassword } = body;

    if (authUser.sub !== targetId && authUser.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    if (!newPassword || newPassword.length < 6) {
      return reply.code(400).send({ error: 'password must be at least 6 characters' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: targetId } });
      if (!user) return reply.code(404).send({ error: 'User not found' });

      if (authUser.sub === targetId) {
        if (!currentPassword) return reply.code(400).send({ error: 'currentPassword required' });
        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) return reply.code(401).send({ error: 'Current password incorrect' });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: targetId }, data: { passwordHash: hash } });

      return { success: true };
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // Delete user (admin only)
  fastify.delete('/users/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = request.user as any;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' });

    const targetId = Number((request.params as any).id);

    try {
      await prisma.user.delete({ where: { id: targetId } });
      return { success: true };
    } catch (err: any) {
      if (err.code === 'P2025') return reply.code(404).send({ error: 'User not found' });
      return reply.code(400).send({ error: err.message });
    }
  });
}
