
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-barber-dark">إعدادات الإدارة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">رقم الواتساب</Label>
              <Input
                id="whatsapp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue"
                placeholder="+972509617061"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني للإشعارات</Label>
              <Input
                id="email"
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue"
                placeholder="admin@example.com"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-barber-blue hover:bg-barber-blue/90"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
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
