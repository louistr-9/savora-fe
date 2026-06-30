import { getPlans, getUserFinancialContext } from './actions';
import TravelClient from './TravelClient';

export default async function TravelPage() {
  const [plans, financialContext] = await Promise.all([
    getPlans(),
    getUserFinancialContext(),
  ]);

  return <TravelClient initialPlans={plans} financialContext={financialContext} />;
}

