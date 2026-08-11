export type PlanLike = {
  slug: string;
  features?: unknown;
};

export type AnalyticsLevel = 'basic' | 'advanced' | 'full';

export type PlanCapabilities = {
  analyticsLevel: AnalyticsLevel;
  canUsePasswordExpiry: boolean;
  canUseSvgQr: boolean;
  canUseApiAnalytics: boolean;
};

function featureText(plan: PlanLike) {
  return Array.isArray(plan.features) ? plan.features.map((feature) => String(feature).toLowerCase()) : [];
}

export function getPlanCapabilities(plan: PlanLike): PlanCapabilities {
  const slug = plan.slug.toLowerCase();
  const features = featureText(plan);
  const isBusiness = slug === 'business' || features.some((feature) => feature.includes('full analytics'));
  const isPro = isBusiness || slug === 'pro' || features.some((feature) => feature.includes('password') || feature.includes('svg'));

  return {
    analyticsLevel: isBusiness ? 'full' : isPro ? 'advanced' : 'basic',
    canUsePasswordExpiry: isPro,
    canUseSvgQr: isPro,
    canUseApiAnalytics: isBusiness,
  };
}
