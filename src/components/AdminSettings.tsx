
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminConfig } from '@/hooks/useAdmin';

interface AdminSettingsProps {
  onClose: () => void;
}

const AdminSettings = ({ onClose }: AdminSettingsProps) => {
  const { config, updateConfig, loading } = useAdminConfig();
  const [whatsappNumber, setWhatsappNumber] = useState(config?.whatsapp_number || '');
  const [notificationEmail, setNotificationEmail] = useState(config?.notification_email || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      whatsapp_number: whatsappNumber,
      notification_email: notificationEmail || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="bg-white">
          <CardTitle className="text-center text-barber-dark">إعدادات الإدارة</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-gray-700">رقم الواتساب</Label>
              <Input
                id="whatsapp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue bg-white text-gray-900"
                placeholder="+972509617061"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">البريد الإلكتروني للإشعارات</Label>
              <Input
                id="email"
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue bg-white text-gray-900"
                placeholder="admin@example.com"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-barber-blue hover:bg-barber-blue/90 text-white"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white text-gray-700 border-gray-300"
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
