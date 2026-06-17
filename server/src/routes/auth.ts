import { FastifyInstance } from 'fastify';
import prisma from '../db';
import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as any;
    if (!email || !password) return reply.code(400).send({ error: 'email and password required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.code(401).send({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: 'invalid credentials' });
    const token = fastify.jwt.sign({ sub: user.id, email: user.email, role: user.role, name: user.name });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  fastify.get('/auth/me', async (request, reply) => {
    try {
      await fastify.authenticate(request, reply);
      const userId = (request.user as any).sub;
      const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
      if (!user) return reply.code(404).send({ error: 'Not found' });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } catch (err) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  });
}
