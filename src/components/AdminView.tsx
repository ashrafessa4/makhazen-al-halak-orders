
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import AdminDashboard from '@/components/AdminDashboard';
import { Order } from '@/types';

interface AdminViewProps {
  orders: Order[];
  onBackToStore: () => void;
}

const AdminView = ({ orders, onBackToStore }: AdminViewProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="flex justify-between items-center p-4 sm:p-6 bg-white border-b">
          <h1 className="text-xl sm:text-2xl font-bold text-barber-dark">لوحة التحكم</h1>
          <Button
            onClick={onBackToStore}
            variant="outline"
          >
            العودة للمتجر
          </Button>
        </div>
        <AdminDashboard orders={orders} />
      </div>
    </div>
  );
};

export default AdminView;
