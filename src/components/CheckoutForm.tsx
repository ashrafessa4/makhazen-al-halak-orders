
import { useState } from 'react';
import { OrderFormData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CheckoutFormProps {
  onSubmit: (data: OrderFormData) => void;
  onBack: () => void;
  total: number;
}

const CheckoutForm = ({ onSubmit, onBack, total }: CheckoutFormProps) => {
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    shopName: '',
    city: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.shopName || !formData.city) {
      return;
    }
    onSubmit(formData);
  };

  const updateField = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-barber-dark">إتمام الطلب</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerName">الاسم الكامل *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="أدخل اسمك الكامل"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="shopName">اسم صالون الحلاقة *</Label>
            <Input
              id="shopName"
              value={formData.shopName}
              onChange={(e) => updateField('shopName', e.target.value)}
              placeholder="أدخل اسم الصالون"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="city">المدينة *</Label>
            <Select value={formData.city} onValueChange={(value) => updateField('city', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="كفر قاسم">كفر قاسم</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold text-barber-dark mb-4">
              <span>المجموع النهائي:</span>
              <span>₪{total}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
            >
              العودة
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-barber-green hover:bg-barber-green/90"
              disabled={!formData.customerName || !formData.shopName || !formData.city}
            >
              تأكيد الطلب
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;
