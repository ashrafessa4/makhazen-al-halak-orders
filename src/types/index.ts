
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  shopName: string;
  city: string;
  notes: string;
  items: CartItem[];
  total: number;
  date: Date;
  status: 'pending' | 'processing' | 'completed';
}

export interface OrderFormData {
  customerName: string;
  shopName: string;
  city: string;
  notes: string;
}
