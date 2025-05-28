
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminConfig } from '@/hooks/useAdmin';
import { toast } from '@/hooks/use-toast';

interface AdminSettingsProps {
  onClose: () => void;
}

const AdminSettings = ({ onClose }: AdminSettingsProps) => {
  const { config, updateConfig, loading } = useAdminConfig();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');

  // Load current values when component mounts or config changes
  useEffect(() => {
    if (config) {
      setWhatsappNumber(config.whatsapp_number || '');
      setNotificationEmail(config.notification_email || '');
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one field is filled
    if (!whatsappNumber.trim() && !notificationEmail.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "يجب ملء رقم الواتساب أو البريد الإلكتروني على الأقل",
        variant: "destructive",
      });
      return;
    }

    await updateConfig({
      whatsapp_number: whatsappNumber.trim() || null,
      notification_email: notificationEmail.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-2xl animate-scale-in">
        <CardHeader className="bg-gradient-to-r from-barber-blue to-barber-green text-white rounded-t-lg">
          <CardTitle className="text-center text-white">إعدادات الإدارة</CardTitle>
        </CardHeader>
        <CardContent className="bg-white space-y-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-gray-800 font-semibold">رقم الواتساب</Label>
              <Input
                id="whatsapp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue bg-white text-gray-900 placeholder:text-gray-500 h-12 text-lg transition-all duration-200 hover:border-gray-400"
                placeholder="+972509617061"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-800 font-semibold">البريد الإلكتروني للإشعارات</Label>
              <Input
                id="email"
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue bg-white text-gray-900 placeholder:text-gray-500 h-12 text-lg transition-all duration-200 hover:border-gray-400"
                placeholder="admin@example.com"
                dir="rtl"
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              * يجب ملء حقل واحد على الأقل (رقم الواتساب أو البريد الإلكتروني)
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-barber-blue to-barber-green hover:from-barber-blue/90 hover:to-barber-green/90 text-white h-12 text-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 h-12 text-lg font-semibold transition-all duration-200"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
