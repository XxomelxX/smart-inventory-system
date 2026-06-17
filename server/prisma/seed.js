"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../src/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    console.log('Seeding DB...');
    const products = [
        { sku: 'P001', name: 'Sample Soap', price: 25.0, stock: 50, barcode: '4801234567890' },
        { sku: 'P002', name: 'Sample Shampoo', price: 75.0, stock: 20, barcode: '4801234567891' },
        { sku: 'P003', name: 'Toothpaste', price: 60.0, stock: 30, barcode: '4801234567892' }
    ];
    for (const p of products) {
        await db_1.default.product.upsert({ where: { sku: p.sku }, update: { name: p.name, price: p.price, stock: p.stock, barcode: p.barcode }, create: p });
    }
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPass = process.env.SEED_ADMIN_PASS || 'password';
    const hash = await bcryptjs_1.default.hash(adminPass, 10);
    await db_1.default.user.upsert({ where: { email: adminEmail }, update: { name: 'Admin', passwordHash: hash, role: 'admin' }, create: { email: adminEmail, name: 'Admin', passwordHash: hash, role: 'admin' } });
    console.log('Done.');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => db_1.default.$disconnect());
