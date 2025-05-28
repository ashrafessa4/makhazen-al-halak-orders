
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductFormData } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import ImageUpload from './ImageUpload';

interface AddProductModalProps {
  onClose: () => void;
}

const AddProductModal = ({ onClose }: AddProductModalProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    image: '',
    description: '',
    category: '',
  });
  
  const { addProduct, loading } = useProducts();

  const categories = ['أدوات', 'ماكينات', 'منتجات العناية'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.image) {
      alert('يرجى إضافة صورة للمنتج');
      return;
    }
    
    await addProduct(formData);
    onClose();
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-center text-barber-dark">إضافة منتج جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنتج</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">السعر (₪)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                className="border-2 border-gray-300 focus:border-barber-blue"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="border-2 border-gray-300 focus:border-barber-blue">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <ImageUpload
              onImageChange={(imageUrl) => handleInputChange('image', imageUrl)}
            />
            
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="border-2 border-gray-300 focus:border-barber-blue"
                rows={3}
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-barber-green hover:bg-barber-green/90"
              >
                {loading ? 'جاري الإضافة...' : 'إضافة المنتج'}
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

export default AddProductModal;
