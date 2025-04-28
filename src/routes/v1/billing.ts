import prisma from '../../client';
import { stripe } from '../../utils/stripe';
import express from 'express';
import { Prisma, User, Company, Subscription, SubscriptionStatus, Plan } from '@prisma/client';
import Stripe from 'stripe';

type UserWithStripe = User & {
  stripeCustomerId: string;
  company: Company | null;
};

type SubscriptionWithStripeId = Subscription & {
  stripeSubscriptionId: string;
};

const router = express.Router();

const mapPriceToPlan = (priceId: string): number => {
  const planMap: Record<string, number> = {
    // Monthly price IDs
    price_1RH8eXPuMpDKUxfQN4XUH99L: 1, // SILVER monthly
    price_1RH8eZPuMpDKUxfQAWOjGe19: 2, // GOLD monthly
    price_1RH8ecPuMpDKUxfQhtgExI7J: 3, // PLATINUM monthly
    // Annual price IDs
    price_1RHMYxPuMpDKUxfQxa4sycID: 1, // SILVER annual
    price_1RHMYyPuMpDKUxfQFLGZqK9Y: 2, // GOLD annual
    price_1RHMYzPuMpDKUxfQPupJxWdP: 3 // PLATINUM annual
  };
  return planMap[priceId] ?? 1;
};

const determinePlanFromPrice = (priceId: string): number => {
  const map: Record<string, number> = {
    price_1RH8eXPuMpDKUxfQN4XUH99L: 1,
    price_1RH8eZPuMpDKUxfQAWOjGe19: 2,
    price_1RH8ecPuMpDKUxfQhtgExI7J: 3
  };
  return map[priceId] ?? 1;
};

const handleCheckoutSuccess = async (req: express.Request, res: express.Response) => {
  const session_id = req.method === 'GET' ? req.query.session_id : req.body.session_id;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'Session ID required'
    });
  }

  try {
    // 1. Get Checkout Session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    if (!session || !session.customer || !session.subscription) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data'
      });
    }

    // 2. Fetch Stripe Subscription details
    const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);

    // Debug logging
    console.log('Stripe subscription data:', {
      billing_cycle_anchor: (stripeSub as any).billing_cycle_anchor,
      raw: stripeSub
    });

    // Calculate current period end based on billing cycle anchor and interval
    const billingCycleAnchor = (stripeSub as any).billing_cycle_anchor;
    if (!billingCycleAnchor || typeof billingCycleAnchor !== 'number') {
      throw new Error('Invalid billing_cycle_anchor from Stripe subscription');
    }

    // Get the plan interval to determine how to calculate the end date
    const plan = (stripeSub as any).plan;
    const interval = plan?.interval;
    const intervalCount = Number(plan?.interval_count) || 1;
    const isTrial = stripeSub.status === 'trialing';
    const trialEnd = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null;

    let currentPeriodEnd: number;
    if (isTrial && trialEnd) {
      // If it's a trial, use the trial end date
      currentPeriodEnd = trialEnd.getTime();
    } else if (interval === 'year') {
      // For yearly subscriptions, add the number of years
      const endDate = new Date(billingCycleAnchor * 1000);
      endDate.setFullYear(endDate.getFullYear() + intervalCount);
      currentPeriodEnd = endDate.getTime();
    } else if (interval === 'month') {
      // For monthly subscriptions, add the number of months
      const endDate = new Date(billingCycleAnchor * 1000);
      endDate.setMonth(endDate.getMonth() + intervalCount);
      currentPeriodEnd = endDate.getTime();
    } else {
      throw new Error(`Unsupported subscription interval: ${interval}`);
    }

    // 3. Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: {
        stripeCustomerId: session.customer as string
      } as unknown as Prisma.UserWhereInput,
      include: { company: true }
    });

    if (!user || !user.companyId) {
      return res.status(404).json({
        success: false,
        error: 'User or company not found'
      });
    }

    // 4. Handle multiple subscriptions
    // First, check if this subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id }
    });

    // Mark any other active subscriptions as canceled
    await prisma.subscription.updateMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        NOT: {
          stripeSubscriptionId: stripeSub.id
        }
      },
      data: {
        status: 'CANCELED' as const
      }
    });

    // Create or update subscription
    const subscriptionData = {
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status.toUpperCase() as SubscriptionStatus,
      currentPeriodEnd: new Date(currentPeriodEnd),
      cancelAtPeriodEnd: (stripeSub as any).cancel_at_period_end ?? false,
      user: {
        connect: { id: user.id }
      },
      company: {
        connect: { id: user.companyId }
      },
      plan: {
        connect: { id: mapPriceToPlan(stripeSub.items.data[0].price.id) }
      }
    } as const;

    let newSubscription;
    if (existingSubscription) {
      // Update existing subscription
      newSubscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: subscriptionData as unknown as Prisma.SubscriptionUpdateInput,
        include: {
          user: true,
          company: true,
          plan: true
        }
      });
    } else {
      // Create new subscription
      newSubscription = await prisma.subscription.create({
        data: subscriptionData as unknown as Prisma.SubscriptionCreateInput,
        include: {
          user: true,
          company: true,
          plan: true
        }
      });
    }

    // 5. Update company's current plan
    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        Plan: {
          connect: {
            id: mapPriceToPlan(stripeSub.items.data[0].price.id)
          }
        }
      }
    });

    // 6. Update user's subscription status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: stripeSub.id,
        currentPeriodEnd: new Date(currentPeriodEnd)
      } as unknown as Prisma.UserUpdateInput
    });

    // 7. Return success response with subscription history
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        plan: true
      }
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: newSubscription.id,
        planId: newSubscription.planId,
        status: newSubscription.status,
        currentPeriodEnd: newSubscription.currentPeriodEnd,
        isTrial: stripeSub.status === 'trialing'
      },
      subscriptionHistory: subscriptions.map((sub) => ({
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        plan: sub.plan,
        createdAt: sub.createdAt
      }))
    });
  } catch (error) {
    console.error('[checkout-success error]', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Something went wrong during checkout success.'
    });
  }
};

// Use the same handler for both GET and POST
router.get('/checkout-success', handleCheckoutSuccess);
router.post('/checkout-success', handleCheckoutSuccess);

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, priceId, success_url, cancel_url, isTrial, discountCode } = req.body;

    if (!userId || !priceId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId and priceId are required'
      });
    }

    // 1. Get user and company details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({
        error: 'User or company not found'
      });
    }

    // 2. Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.company.name || undefined,
        metadata: {
          userId: user.id,
          companyId: user.company.id
        }
      } as Stripe.CustomerCreateParams);
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    // Check if user has already used a trial
    const hasUsedTrial = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'TRIALING'
      }
    });

    // 3. If there's a discount code, validate it first
    let discounts;
    if (discountCode) {
      // First check our database
      const dbDiscount = await prisma.discountCode.findFirst({
        where: {
          code: discountCode,
          isActive: true,
          status: 'ACTIVE',
          validFrom: {
            lte: new Date()
          },
          OR: [
            { validUntil: null },
            { validUntil: { gt: new Date() } }
          ]
        }
      });

      if (dbDiscount) {
        // If we have a valid code in our database, create a Stripe coupon
        try {
          const coupon = await stripe.coupons.create({
            percent_off: dbDiscount.type === 'PERCENTAGE' ? dbDiscount.discount : undefined,
            amount_off: dbDiscount.type === 'FIXED_AMOUNT' ? dbDiscount.discount * 100 : undefined,
            currency: 'usd',
            duration: 'once'
          });

          discounts = [{ coupon: coupon.id }];
        } catch (error) {
          console.error('Error creating Stripe coupon:', error);
          // If we can't create a Stripe coupon, we'll proceed without the discount
        }
      }
    }

    // 4. Create Stripe Checkout Session with trial period and discount
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      discounts: discounts,
      subscription_data: {
        trial_period_days: isTrial && !hasUsedTrial ? 7 : undefined // 7-day trial if requested and not used before
      },
      success_url:
        success_url || `${process.env.FRONTEND_URL}/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL}/subscription`,
      metadata: {
        userId: user.id,
        companyId: user.company.id,
        isTrial: isTrial ? 'true' : 'false'
      }
    });

    // 5. Send the session URL back to the frontend
    res.json({ url: session.url });
  } catch (error) {
    console.error('[create-checkout-session error]', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Find the active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: parseInt(userId),
        OR: [{ status: 'ACTIVE' }, { status: 'TRIALING' }]
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Cancel the subscription in Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update the subscription in our database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true
      }
    });

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period'
    });
  } catch (error) {
    console.error('[cancel-subscription error]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    });
  }
});

router.post('/confirm-subscription', async (req, res) => {
  const { userId } = req.body;

  const user = (await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    include: { company: true }
  })) as UserWithStripe | null;

  if (!user?.stripeCustomerId || !user.company) {
    return res.status(404).json({ error: 'User or company not found' });
  }

  // 🔍 Get the latest active subscription for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'all',
    limit: 1
  });

  const subscription = subscriptions.data[0];
  if (!subscription) return res.status(404).json({ error: 'No subscriptions found' });

  // Determine plan by priceId
  const priceId = subscription.items.data[0].price.id;
  const planId = mapPriceToPlan(priceId);

  // Find existing subscription by stripeSubscriptionId
  const [existingSubscription] = await prisma.$queryRaw<Subscription[]>`
    SELECT * FROM "Subscription" WHERE "stripeSubscriptionId" = ${subscription.id}
  `;

  // 📦 Save to Prisma
  const subscriptionData = {
    userId: user.id,
    companyId: user.company.id,
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    status: subscription.status.toUpperCase() as SubscriptionStatus,
    planId
  } as const;

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: subscriptionData
    });
  } else {
    const createData = {
      ...subscriptionData,
      stripeSubscriptionId: subscription.id
    } as unknown as Prisma.SubscriptionCreateInput;

    await prisma.subscription.create({
      data: createData
    });
  }

  // ✅ Update company plan
  await prisma.company.update({
    where: { id: user.company.id },
    data: { planId }
  });

  res.json({ success: true });
});

// Get billing details for a user or company
router.get('/details', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const companyId = req.query.companyId as string;

    if (!userId && !companyId) {
      return res.status(400).json({
        success: false,
        error: 'User ID or Company ID is required'
      });
    }

    let subscription;
    let company;
    let hasUsedTrial = false;

    if (companyId) {
      // Get company with its active subscription
      company = await prisma.company.findUnique({
        where: { id: parseInt(companyId) },
        include: {
          subscriptions: {
            where: {
              OR: [{ status: 'ACTIVE' }, { status: 'TRIALING' }]
            },
            include: {
              plan: true
            }
          }
        }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Company not found'
        });
      }

      subscription = company.subscriptions[0];

      // Check if company has ever used a trial
      const trialHistory = await prisma.subscription.findFirst({
        where: {
          companyId: parseInt(companyId),
          status: 'TRIALING'
        }
      });
      hasUsedTrial = !!trialHistory;
    } else {
      // Get user with their active subscription
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        include: {
          subscriptions: {
            where: {
              OR: [{ status: 'ACTIVE' }, { status: 'TRIALING' }]
            },
            include: {
              plan: true
            }
          },
          company: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      company = user.company;
      subscription = user.subscriptions[0];

      // Check if user has ever used a trial
      const trialHistory = await prisma.subscription.findFirst({
        where: {
          userId: parseInt(userId),
          status: 'TRIALING'
        }
      });
      hasUsedTrial = !!trialHistory;
    }

    // If there's a subscription, get the trial end date from Stripe
    let trialEnd = null;
    if (subscription?.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        if (stripeSubscription.trial_end) {
          trialEnd = new Date(stripeSubscription.trial_end * 1000);
        }
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    res.json({
      success: true,
      data: {
        company,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              plan: subscription.plan,
              trialEnd: trialEnd
            }
          : null,
        hasUsedTrial
      }
    });
  } catch (error) {
    console.error('[billing-details error]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch billing details'
    });
  }
});

// Create a Stripe Customer Portal session
router.post('/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user with their Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({
        success: false,
        error: 'User or Stripe customer not found'
      });
    }

    // Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/vendor-dashboard/settings`
    });

    res.json({
      success: true,
      url: portalSession.url
    });
  } catch (error) {
    console.error('[create-portal-session error]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create portal session'
    });
  }
});

// Check and handle expired subscriptions
router.post('/check-expired-subscriptions', async (req, res) => {
  try {
    const now = new Date();

    // Find all active and trialing subscriptions that have passed their currentPeriodEnd
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        OR: [{ status: 'ACTIVE' }, { status: 'TRIALING' }],
        currentPeriodEnd: {
          lt: now
        }
      },
      include: {
        user: true,
        company: true
      }
    });

    // Update each expired subscription
    for (const subscription of expiredSubscriptions) {
      // Update subscription status
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED' as const,
          cancelAtPeriodEnd: true
        }
      });

      // Update company's plan if needed
      if (subscription.company) {
        await prisma.company.update({
          where: { id: subscription.company.id },
          data: {
            planId: null // Remove the plan association
          }
        });
      }

      // Update user's subscription status
      if (subscription.user) {
        await prisma.user.update({
          where: { id: subscription.user.id },
          data: {
            stripeSubscriptionId: null,
            currentPeriodEnd: null
          }
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${expiredSubscriptions.length} expired subscriptions`,
      expiredSubscriptions: expiredSubscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        companyId: sub.companyId,
        currentPeriodEnd: sub.currentPeriodEnd,
        status: sub.status
      }))
    });
  } catch (error) {
    console.error('[check-expired-subscriptions error]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process expired subscriptions'
    });
  }
});

// Get subscription details for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    // Get company with its active subscription
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          where: {
            OR: [{ status: 'ACTIVE' }, { status: 'TRIALING' }]
          },
          include: {
            plan: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    const subscription = company.subscriptions[0];

    // If there's a subscription, get the trial end date from Stripe
    let trialEnd = null;
    if (subscription?.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        if (stripeSubscription.trial_end) {
          trialEnd = new Date(stripeSubscription.trial_end * 1000);
        }
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    res.json({
      success: true,
      data: {
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              plan: subscription.plan,
              trialEnd: trialEnd
            }
          : null
      }
    });
  } catch (error) {
    console.error('[get-company-subscription error]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get company subscription'
    });
  }
});

// Check usage limits before downgrading
router.post('/check-downgrade-limits', async (req, res) => {
  try {
    const { companyId, targetPlanId } = req.body;

    if (!companyId || !targetPlanId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID and target plan ID are required'
      });
    }

    // Get current usage
    const [productsCount, campaignsCount, promotionsCount, usersCount] = await Promise.all([
      prisma.product.count({ where: { companyId } }),
      prisma.campaign.count({ where: { companyId } }),
      prisma.promotion.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId } })
    ]);

    // Get target plan limits
    const targetPlan = await prisma.plan.findUnique({
      where: { id: parseInt(targetPlanId) }
    });

    if (!targetPlan) {
      return res.status(404).json({
        success: false,
        error: 'Target plan not found'
      });
    }

    // Check limits based on plan
    const limits = {
      products: {
        current: productsCount,
        limit: targetPlan.planType === 'SILVER' ? 1 : targetPlan.planType === 'GOLD' ? 30 : Infinity,
        exceeded: false
      },
      campaigns: {
        current: campaignsCount,
        limit: targetPlan.planType === 'SILVER' ? 1 : Infinity,
        exceeded: false
      },
      promotions: {
        current: promotionsCount,
        limit: targetPlan.planType === 'SILVER' ? 1 : targetPlan.planType === 'GOLD' ? 10 : Infinity,
        exceeded: false
      },
      users: {
        current: usersCount,
        limit: targetPlan.planType === 'PLATINUM' ? Infinity : 1,
        exceeded: false
      }
    };

    // Check if any limits are exceeded
    limits.products.exceeded = limits.products.current > limits.products.limit;
    limits.campaigns.exceeded = limits.campaigns.current > limits.campaigns.limit;
    limits.promotions.exceeded = limits.promotions.current > limits.promotions.limit;
    limits.users.exceeded = limits.users.current > limits.users.limit;

    const hasExceededLimits = limits.products.exceeded || limits.campaigns.exceeded || limits.promotions.exceeded || limits.users.exceeded;

    res.json({
      success: true,
      data: {
        limits,
        hasExceededLimits,
        targetPlanType: targetPlan.planType
      }
    });
  } catch (error) {
    console.error('[check-downgrade-limits error]', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check downgrade limits'
    });
  }
});

// Add this new endpoint for validating discount codes
router.post('/validate-discount-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Discount code is required'
      });
    }

    // First check the database
    const discountCode = await prisma.discountCode.findFirst({
      where: {
        code,
        isActive: true,
        status: 'ACTIVE',
        validFrom: {
          lte: new Date()
        },
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } }
        ]
      }
    });

    if (!discountCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired discount code'
      });
    }

    // If we have a valid code in the database, try to apply it in Stripe
    try {
      // First try to retrieve as a promotion code
      const promotionCode = await stripe.promotionCodes.retrieve(code);
      console.log('Promotion code:', promotionCode);

      if (!promotionCode || !promotionCode.active) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired discount code'
        });
      }

      // Get the coupon details
      const coupon = await stripe.coupons.retrieve(promotionCode.coupon.id);
      console.log('Coupon:', coupon);

      // Return the promotion code details
      res.json({
        success: true,
        code: promotionCode.code,
        discount: coupon.percent_off || coupon.amount_off,
        type: coupon.percent_off ? 'PERCENTAGE' : 'FIXED_AMOUNT'
      });
    } catch (stripeError: any) {
      // If Stripe validation fails but we have a valid code in our DB,
      // return the database discount code details
      res.json({
        success: true,
        code: discountCode.code,
        discount: discountCode.discount,
        type: discountCode.type
      });
    }
  } catch (error) {
    console.error('[validate-discount-code error]', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate discount code'
    });
  }
});

export default router;
