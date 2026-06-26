import { getPlans, getUserFinancialContext } from './actions';
import PlanClient from './PlanClient';

export default async function PlanPage() {
  const [plans, financialContext] = await Promise.all([
    getPlans(),
    getUserFinancialContext(),
  ]);

  return <PlanClient initialPlans={plans} financialContext={financialContext} />;
}

