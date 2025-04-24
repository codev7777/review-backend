import prisma from '../../client';
import { stripe } from '../../utils/stripe';
import express from 'express';
import { Prisma, User, Company, Subscription, SubscriptionStatus, Plan } from '@prisma/client';

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
      status: 'ACTIVE' as const,
      currentPeriodEnd: Number((stripeSub as any).current_period_end)
        ? new Date(Number((stripeSub as any).current_period_end) * 1000)
        : new Date(),
      cancelAtPeriodEnd: (stripeSub as any).cancel_at_period_end ?? false,
      user: {
        connect: {
          id: user.id
        }
      },
      company: {
        connect: {
          id: user.companyId
        }
      },
      plan: {
        connect: {
          id: mapPriceToPlan(stripeSub.items.data[0].price.id)
        }
      }
    };

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
        currentPeriodEnd: Number((stripeSub as any).current_period_end)
          ? new Date(Number((stripeSub as any).current_period_end) * 1000)
          : new Date()
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
        currentPeriodEnd: newSubscription.currentPeriodEnd
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
    const { userId, priceId, success_url, cancel_url } = req.body;
    console.log('[create-checkout-session]', req.body);

    if (!userId || !priceId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          userId: !userId ? 'User ID is required' : undefined,
          priceId: !priceId ? 'Price ID is required' : undefined
        }
      });
    }

    // 1. Find the user and their associated company
    const user = (await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { company: true }
    })) as
      | (User & {
          subscriptions: (Subscription & {
            plan: Plan;
          })[];
          company: Company | null;
        })
      | null;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.company) {
      return res.status(400).json({ error: 'User must be associated with a company' });
    }

    // 2. Create Stripe Customer if the user doesn't have one
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          companyId: user.company.id
        }
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url:
        success_url || `${process.env.FRONTEND_URL}/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL}/subscription`,
      metadata: {
        userId: user.id,
        companyId: user.company.id
      }
    });

    // 4. Send the session URL back to the frontend
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
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    // Find user and subscription
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.subscriptions.length) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const subscription = user.subscriptions[0]; // Assuming the user has one subscription

    // Cancel the subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update the subscription in our database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true
      }
    });

    res.json({ message: 'Subscription will be cancelled at the end of the billing period' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Error cancelling subscription' });
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

// Get billing details for a user
router.get('/details', async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get user with their active subscription
    const user = (await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            plan: true
          }
        },
        company: true
      }
    })) as
      | (User & {
          subscriptions: (Subscription & {
            plan: Plan;
          })[];
          company: Company | null;
        })
      | null;

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const activeSubscription = user.subscriptions[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripeCustomerId: user.stripeCustomerId
        },
        company: user.company,
        subscription: activeSubscription
          ? {
              id: activeSubscription.id,
              status: activeSubscription.status,
              currentPeriodEnd: activeSubscription.currentPeriodEnd,
              cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
              plan: activeSubscription.plan
            }
          : null
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

export default router;
