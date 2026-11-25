export type DegenPlanId = 'free' | 'plus' | 'pro' | 'max' | 'ultra';

export type DegenPlan = {
  id: DegenPlanId;
  priceMinor: number;
  mobileLeverage: number;
  desktopLeverage: number;
  available: boolean;
};

export type DegenSubscription = {
  plan: DegenPlanId;
  paidUntil: string | null;
  autoRenew: boolean;
  plans: DegenPlan[];
};

export const degenNames: Record<DegenPlanId, string> = {
  free: 'Free', plus: 'Plus', pro: 'Pro', max: 'Max', ultra: 'Ultra',
};

export function activeDegenPlan(subscription: DegenSubscription | null): DegenPlan | undefined {
  const expired = subscription?.paidUntil && Date.parse(subscription.paidUntil) <= Date.now();
  return subscription?.plans.find(plan => plan.id === (expired ? 'free' : subscription.plan));
}

export function degenErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  switch (code) {
    case 'insufficient_available_balance': return 'Insufficient available balance.';
    case 'degen_plan_unavailable': return 'This plan is currently unavailable.';
    case 'degen_subscription_active': return 'A paid plan is already active on this account.';
    default: return 'Could not update your plan. Try again.';
  }
}
