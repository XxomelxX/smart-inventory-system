import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import auditRoutes from './routes/audit';
import prisma from './db';

const server = Fastify({ logger: true });

server.get('/health', async () => ({ ok: true }));

// Enable CORS for frontend dev server
server.register(fastifyCors, { origin: true });

// JWT plugin
server.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET || 'dev-secret' });
server.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

server.register(authRoutes, { prefix: '/api' });
server.register(usersRoutes, { prefix: '/api' });
server.register(productsRoutes, { prefix: '/api' });
server.register(ordersRoutes, { prefix: '/api' });
server.register(auditRoutes, { prefix: '/api' });

const start = async () => {
  try {
    await prisma.$connect();
    await server.listen({ port: 4000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
