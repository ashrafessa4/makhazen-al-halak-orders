
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { OrderFormData } from '@/types';

interface CheckoutFormProps {
  onSubmit: (formData: OrderFormData) => void;
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
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-60"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747733461-0524ba8de5ad?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-10 blur-sm"></div>
      
      <Card className="w-full max-w-2xl relative z-10 bg-white/95 backdrop-blur-sm border-2 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-barber-dark drop-shadow-md">
            إتمام الطلب
          </CardTitle>
          <p className="text-barber-green font-semibold text-xl drop-shadow-sm">
            المجموع الكلي: ₪{total.toFixed(2)}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-barber-dark font-semibold drop-shadow-sm">
                  اسم العميل
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="border-2 border-gray-300 focus:border-barber-blue bg-white/90 h-12 text-lg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-barber-dark font-semibold drop-shadow-sm">
                  اسم الصالون
                </Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => handleInputChange('shopName', e.target.value)}
                  className="border-2 border-gray-300 focus:border-barber-blue bg-white/90 h-12 text-lg"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city" className="text-barber-dark font-semibold drop-shadow-sm">
                المدينة
              </Label>
              <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-barber-blue bg-white/90 h-12 text-lg">
                  <SelectValue placeholder="اختر المدينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="كفر قاسم">كفر قاسم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-barber-dark font-semibold drop-shadow-sm">
                ملاحظات إضافية (اختياري)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue bg-white/90 min-h-20 text-lg"
                placeholder="أي ملاحظات أو طلبات خاصة..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 h-12 text-lg font-semibold border-2 hover:bg-gray-100"
              >
                <ArrowRight className="ml-2 h-5 w-5" />
                العودة
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-barber-green hover:bg-barber-green/90 text-white font-bold h-12 text-lg"
              >
                تأكيد الطلب
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutForm;
