export const PLAN_FEATURES = [
  'Custom alias',
  'Basic analytics',
  'Advanced analytics',
  'Full analytics',
  'PNG QR',
  'PNG/SVG QR',
  'Password & expiry',
  'High API rate limit',
  'Priority support',
] as const;

export type PlanFeature = (typeof PLAN_FEATURES)[number];
