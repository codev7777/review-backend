import { prisma } from '../config/database';
import { Review, Campaign, CampaignStatus, Product, Promotion, Prisma } from '@prisma/client';

interface ReviewDistribution {
  ratio: number;
  count: number;
}

interface WeeklyReview {
  week: string;
  count: number;
}

interface CampaignPerformance {
  campaignId: number;
  title: string;
  claims: number;
  ratio: number;
}

export const getAdminStatistics = async () => {
  // Get total vendors
  const totalVendors = await prisma.company.count();

  // Get active campaigns
  const activeCampaigns = await prisma.campaign.count({
    where: { isActive: CampaignStatus.YES }
  });

  // Get all reviews
  const reviews = await prisma.review.findMany({
    include: {
      Product: true,
      Campaign: true
    } as Prisma.ReviewInclude
  });

  // Calculate average rating
  const averageRating = reviews.length
    ? (
        reviews.reduce((sum: number, review: Review) => sum + review.ratio, 0) / reviews.length
      ).toFixed(1)
    : '0.0';

  // Calculate review distribution
  const reviewDistribution = reviews.reduce((acc: ReviewDistribution[], review: Review) => {
    const existing = acc.find((rd: ReviewDistribution) => rd.ratio === review.ratio);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ ratio: review.ratio, count: 1 });
    }
    return acc;
  }, []);

  // Calculate weekly reviews
  const weeklyReviews = reviews.reduce((acc: WeeklyReview[], review: Review) => {
    const week = new Date(review.feedbackDate).toISOString().split('T')[0];
    const existing = acc.find((wr) => wr.week === week);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ week, count: 1 });
    }
    return acc;
  }, []);

  // Get campaign performance using raw query
  const campaigns = await prisma.$queryRaw<
    Array<{ id: number; title: string; claims: number; ratio: number }>
  >`
    SELECT id, title, claims, ratio
    FROM "Campaign"
  `;

  const campaignPerformance = campaigns.map((campaign) => ({
    campaignId: campaign.id,
    title: campaign.title,
    claims: campaign.claims,
    ratio: campaign.ratio
  }));

  return {
    totalVendors,
    activeCampaigns,
    averageRating,
    totalReviews: reviews.length,
    reviewDistribution,
    weeklyReviews,
    campaignPerformance
  };
};

const getColorForRating = (rating: number) => {
  switch (rating) {
    case 5:
      return '#16a34a';
    case 4:
      return '#22c55e';
    case 3:
      return '#facc15';
    case 2:
      return '#f97316';
    case 1:
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const formatWeeklyData = (reviews: any[]) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formattedData = days.map((day) => ({ name: day, value: 0 }));

  reviews.forEach((review) => {
    const day = new Date(review.createdAt).getDay();
    formattedData[day].value = review._count;
  });

  return formattedData;
};
