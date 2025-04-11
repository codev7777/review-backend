import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

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

const planTypes = ['SILVER', 'GOLD', 'PLATINUM'] as PlanType[];

async function main() {
  // Create categories
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

  // Create plans
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
