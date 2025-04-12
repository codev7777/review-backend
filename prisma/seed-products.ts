import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    title: 'Premium Kitchen Knife Set',
    description: 'Professional kitchen knife set with wooden block',
    image: 'https://placehold.co/300x300/FFF5E8/FF9130?text=Knife+Set',
    companyId: 1,
    categoryId: 1,
    ratio: 0
  },
  {
    title: 'Yoga Mat',
    description: 'Non-slip exercise yoga mat',
    image: 'https://placehold.co/300x300/FFF5E8/FF9130?text=Yoga+Mat',
    companyId: 1,
    categoryId: 2,
    ratio: 0
  },
  {
    title: 'Bluetooth Headphones',
    description: 'Wireless noise-cancelling headphones',
    image: 'https://placehold.co/300x300/FFF5E8/FF9130?text=Headphones',
    companyId: 1,
    categoryId: 3,
    ratio: 0
  },
  {
    title: 'Smart Watch',
    description: 'Fitness tracking smart watch',
    image: 'https://placehold.co/300x300/FFF5E8/FF9130?text=Watch',
    companyId: 1,
    categoryId: 3,
    ratio: 0
  },
  {
    title: 'Coffee Maker',
    description: 'Automatic coffee maker with timer',
    image: 'https://placehold.co/300x300/FFF5E8/FF9130?text=Coffee',
    companyId: 1,
    categoryId: 1,
    ratio: 0
  }
];

async function main() {
  // Create a company if it doesn't exist
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Sample Company',
      detail: 'A sample company for testing',
      websiteUrl: 'https://example.com',
      ratio: 0,
      reviews: 0
    }
  });

  // Create categories if they don't exist
  const categories = [
    { id: 1, name: 'Kitchen', description: 'Kitchen and cooking products' },
    { id: 2, name: 'Fitness', description: 'Fitness and exercise products' },
    { id: 3, name: 'Electronics', description: 'Electronic devices and accessories' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category
    });
  }

  // Create sample products
  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: {
        id: sampleProducts.indexOf(product) + 1
      },
      update: {},
      create: product
    });
  }

  console.log('Sample products created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
