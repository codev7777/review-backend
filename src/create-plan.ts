import Stripe from 'stripe';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil'
});

const tiers = [
  {
    title: 'SILVER',
    AnnuallyPrice: '49',
    MonthlyPrice: '59',
    description: 'Great for small vendors starting out',
    features: [
      { name: 'Unlimited Reviews', included: true },
      { name: 'Unlimited Leads', included: true },
      { name: '1 Campaign', included: true },
      { name: '1 Promotion', included: true },
      { name: '1 Product', included: true },
      { name: '1 Marketplace', included: true },
      { name: 'Collect Seller Feedback', included: false },
      { name: 'Meta Pixel Support', included: false },
      { name: 'Business Features', included: false }
    ]
  },
  {
    title: 'GOLD',
    AnnuallyPrice: '79',
    MonthlyPrice: '99',
    description: 'For growing businesses expanding their reach',
    features: [
      { name: 'Unlimited Reviews', included: true },
      { name: 'Unlimited Leads', included: true },
      { name: 'Unlimited Campaigns', included: true },
      { name: '10 Promotions', included: true },
      { name: '30 Products', included: true },
      { name: 'All Marketplaces', included: true },
      { name: 'Collect Seller Feedback', included: true },
      { name: 'Personalized Branding', included: true },
      { name: 'Meta Pixel Support', included: true }
    ]
  },
  {
    title: 'PLATIUM',
    AnnuallyPrice: '179',
    MonthlyPrice: '199',
    description: 'For established businesses scaling at full speed',
    features: [
      { name: 'Unlimited Reviews', included: true },
      { name: 'Unlimited Leads', included: true },
      { name: 'Unlimited Campaigns', included: true },
      { name: 'Unlimited Promotions', included: true },
      { name: 'Unlimited Products', included: true },
      { name: 'All Marketplaces', included: true },
      { name: 'Collect Seller Feedback', included: true },
      { name: 'Personalized Branding', included: true },
      { name: 'Meta Pixel Support', included: true },
      { name: 'Multiple Sub-Accounts', included: true }
    ]
  }
];

const output: Record<string, any> = {};

function formatMetadata(features: { name: string; included: boolean }[]) {
  const meta: Record<string, string> = {};
  for (const f of features) {
    meta[f.name] = String(f.included);
  }
  return meta;
}

async function createPlans() {
  console.log('🚀 Creating products & prices with features metadata...');

  for (const tier of tiers) {
    const metadata = formatMetadata(tier.features);

    const product = await stripe.products.create({
      name: `${tier.title} Plan`,
      description: tier.description,
      metadata
    });

    const monthlyPrice = await stripe.prices.create({
      unit_amount: parseInt(tier.MonthlyPrice) * 100,
      currency: 'usd',
      recurring: { interval: 'month' },
      product: product.id
    });

    const annualPrice = await stripe.prices.create({
      unit_amount: parseInt(tier.AnnuallyPrice) * 100,
      currency: 'usd',
      recurring: { interval: 'year' },
      product: product.id
    });

    output[tier.title] = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
      features: metadata
    };

    console.log(`✅ ${tier.title} plan created with features.`);
    console.log(`   🟢 Monthly: ${monthlyPrice.id}`);
    console.log(`   🟡 Annual:  ${annualPrice.id}`);
  }

  const outPath = path.join(__dirname, 'stripe-products.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log('\n💾 Features saved to stripe-products.json');
  console.log('🎯 Done!');
}

createPlans().catch((err) => {
  console.error('❌ Error:', err);
});
