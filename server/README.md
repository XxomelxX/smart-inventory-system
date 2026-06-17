# Smart Inventory Backend (Fastify + Prisma)

Quick start:

Install deps and generate Prisma client:

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API endpoints:
- `GET /api/products`
- `POST /api/products/deduct` (body: [{productId, quantity}])
- `POST /api/orders` (body: { items, total, paymentMethod, ... })
- `GET /api/orders`

