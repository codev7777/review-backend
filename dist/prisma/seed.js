"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const categories = [
    'Electronics',
    'Fashion',
    'Home & Kitchen',
    'Health & Beauty',
    'Sports & Outdoors',
    'Toys & Games',
    'Automotive',
    'Books & Media',
    'Groceries & Gourmet Food',
    'Pets',
    'Office Supplies',
    'Baby & Kids',
    'Jewelry & Watches',
    'Tools & Hardware',
    'Gaming'
];
const planTypes = ['SILVER', 'GOLD', 'PLATINUM'];
async function main() {
    for (const categoryName of categories) {
        await prisma.category.upsert({
            where: { name: categoryName },
            update: {},
            create: {
                name: categoryName,
                description: `${categoryName} category`
            }
        });
    }
    for (const planType of planTypes) {
        const price = planType === 'SILVER' ? 10 : planType === 'GOLD' ? 20 : 30;
        await prisma.plan.upsert({
            where: { id: planTypes.indexOf(planType) + 1 },
            update: {},
            create: {
                name: planType,
                price,
                description: `${planType} plan`,
                planType: planType
            }
        });
    }
    console.log('Seed data created successfully');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map