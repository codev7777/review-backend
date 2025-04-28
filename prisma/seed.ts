import { PrismaClient, PlanType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  // Create plans FIRST
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

  // Get platinum plan id (after seeding plans)
  const platinumPlan = await prisma.plan.findFirst({
    where: { planType: 'PLATINUM' },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123456', 10);
  await prisma.user.upsert({
    where: { email: 'info@reviewbrothers.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'info@reviewbrothers.com',
      password: hashedPassword,
      role: Role.ADMIN,
      isEmailVerified: true
    }
  });

  // Create platinum test user
  const testUserPassword = await bcrypt.hash('password123456', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'mitchelgoudkuil@live.nl' },
    update: {},
    create: {
      name: 'Testing User',
      email: 'mitchelgoudkuil@live.nl',
      password: testUserPassword,
      role: Role.USER,
      isEmailVerified: true
    }
  });

  // Create platinum test company
  let testCompany = await prisma.company.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Testing User Company',
      detail: 'A company for the platinum testing user',
      websiteUrl: 'https://testingusercompany.example',
      planId: platinumPlan ? platinumPlan.id : undefined,
      ratio: 0,
      reviews: 0
    }
  });

  // Update testing user to link to the company
  await prisma.user.update({
    where: { id: testUser.id },
    data: { companyId: testCompany.id }
  });

  if (platinumPlan) {
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: 'seed-platinum-mitchelgoudkuil' },
      update: {},
      create: {
        userId: testUser.id,
        companyId: 2,
        stripeSubscriptionId: 'seed-platinum-mitchelgoudkuil',
        status: 'ACTIVE',
        currentPeriodEnd: new Date('2050-12-31T23:59:59.999Z'),
        planId: platinumPlan.id,
      },
    });
  }

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
