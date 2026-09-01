// Which class plans draw a booking out of a credit balance, and which grant
// open access for as long as they run.
//
// 'drop_in' has to sit alongside 'credit_package' here: it is a one-credit pack
// in all but name. While the booking routes tested for 'credit_package' alone,
// a drop-in failed that test, fell through to the recurring branch and was read
// as unlimited — so its credit was never deducted and a £12 drop-in could book
// classes right up until it expired.
const CREDIT_PLAN_TYPES = ['credit_package', 'drop_in']

type PlanLike = { plan_type?: string | null; includes_classes?: boolean | null } | null | undefined

// A plan that spends class_credits_remaining per booking.
export function isCreditPlan(plan: PlanLike): boolean {
  return !!plan?.plan_type && CREDIT_PLAN_TYPES.includes(plan.plan_type)
}

// A plan that covers classes without spending credits (1 Class, 2 Classes,
// Unlimited). Anything credit-based is excluded even though it includes classes.
export function isRecurringClassPlan(plan: PlanLike): boolean {
  return !isCreditPlan(plan) && !!plan?.includes_classes
}
