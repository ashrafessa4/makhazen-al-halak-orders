
import { Button } from '@/components/ui/button';
import { Settings, Plus, LogOut, UserCheck } from 'lucide-react';

interface StoreHeaderProps {
  isAdmin: boolean;
  onAdminLogin: () => void;
  onAdminDashboard: () => void;
  onAddProduct: () => void;
  onAdminSettings: () => void;
  onAdminLogout: () => void;
}

const StoreHeader = ({
  isAdmin,
  onAdminLogin,
  onAdminDashboard,
  onAddProduct,
  onAdminSettings,
  onAdminLogout
}: StoreHeaderProps) => {
  return (
    <div className="text-center mb-8 sm:mb-10">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-barber-dark mb-3 drop-shadow-2xl animate-fade-in">
        متجر أدوات الحلاقة
      </h1>
      <div className="w-24 h-1 bg-gradient-to-r from-barber-blue to-barber-green mx-auto mb-4 rounded-full"></div>
      <p className="text-gray-700 text-lg sm:text-xl drop-shadow-lg font-medium">
        كل ما تحتاجه لصالونك في مكان واحد
      </p>

      {/* Admin Controls */}
      <div className="flex justify-center items-center gap-3 mt-8 flex-wrap">
        {!isAdmin ? (
          <Button
            onClick={onAdminLogin}
            variant="outline"
            className="bg-gradient-to-r from-barber-gold to-barber-gold/80 text-white hover:from-barber-gold/90 hover:to-barber-gold/70 border-none shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <UserCheck className="ml-2 h-4 w-4" />
            تسجيل دخول الإدارة
          </Button>
        ) : (
          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              onClick={onAdminDashboard}
              variant="outline"
              className="bg-gradient-to-r from-barber-blue to-barber-blue/80 text-white hover:from-barber-blue/90 hover:to-barber-blue/70 border-none shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              لوحة التحكم
            </Button>
            <Button
              onClick={onAddProduct}
              className="bg-gradient-to-r from-barber-green to-barber-green/80 hover:from-barber-green/90 hover:to-barber-green/70 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة منتج
            </Button>
            <Button
              onClick={onAdminSettings}
              variant="outline"
              className="bg-white/90 text-barber-dark border-2 border-barber-blue hover:bg-barber-blue hover:text-white shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Settings className="ml-2 h-4 w-4" />
              الإعدادات
            </Button>
            <Button
              onClick={onAdminLogout}
              variant="outline"
              className="bg-white/90 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreHeader;
