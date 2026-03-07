import { callMethod } from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader';
import TopItemsChart from '../../components/Charts/TopItemsChart';
import TopCustomersChart from '../../components/Charts/TopCustomersChart';

interface TopItem     { item_code: string; item_name: string; total_qty: number; total_amount: number }
interface TopCustomer { customer: string; customer_name: string; invoice_count: number; total_revenue: number }

export default function Reports() {
  const { data: topItems, isLoading: itemsLoading } = useQuery<TopItem[]>({
    queryKey: ['top-items'],
    queryFn: () => callMethod('buildsupply.api.reports.get_top_items', { limit: 10, period: 'year' }),
  });

  const { data: topCustomers, isLoading: customersLoading } = useQuery<TopCustomer[]>({
    queryKey: ['top-customers'],
    queryFn: () => callMethod('buildsupply.api.reports.get_top_customers', { limit: 10 }),
  });

  const isLoading = itemsLoading || customersLoading;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1240px] mx-auto">
      <PageHeader title="Reports" subtitle="Business analytics and insights" />

      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopItemsChart data={topItems || []} />
          <TopCustomersChart data={topCustomers || []} />
        </div>
      )}
    </div>
  );
}

