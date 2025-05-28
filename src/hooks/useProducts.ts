
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductFormData } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    console.log('🔄 Starting fetchProducts...');
    setLoading(true);
    try {
      console.log('📡 Making request to fetch products...');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📡 Fetch response:', { data, error });
      
      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }
      
      console.log('✅ Products fetched successfully:', data?.length, 'products');
      setProducts(data || []);
    } catch (error) {
      console.error('❌ Error in fetchProducts:', error);
      toast({
        title: "خطأ في تحميل المنتجات",
        description: "حدث خطأ أثناء تحميل المنتجات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 fetchProducts completed');
    }
  };

  const addProduct = async (productData: ProductFormData) => {
    console.log('🆕 Starting addProduct with data:', productData);
    setLoading(true);
    
    try {
      // Check current user/session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('👤 Current session:', { session: session?.session?.user?.id, error: sessionError });
      
      // Try to get current user
      const { data: user, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', { user: user?.user?.id, error: userError });
      
      console.log('📡 Making request to insert product...');
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      console.log('📡 Insert response:', { data, error });
      
      if (error) {
        console.error('❌ Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Product added successfully:', data);
      await fetchProducts();
      
      toast({
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج بنجاح",
      });
    } catch (error) {
      console.error('❌ Error in addProduct:', error);
      toast({
        title: "خطأ في الإضافة",
        description: "حدث خطأ أثناء إضافة المنتج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 addProduct completed');
    }
  };

  const updateProduct = async (id: string, productData: Partial<ProductFormData>) => {
    console.log('✏️ Starting updateProduct with:', { id, productData });
    setLoading(true);
    
    try {
      // Check current user/session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('👤 Current session for update:', { session: session?.session?.user?.id, error: sessionError });
      
      console.log('📡 Making request to update product...');
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select();

      console.log('📡 Update response:', { data, error, affectedRows: data?.length });
      
      if (error) {
        console.error('❌ Update error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ Update successful but no rows returned. This might indicate RLS blocking the select.');
      }
      
      console.log('✅ Product updated successfully:', data);
      await fetchProducts(); // Refresh the products list
      
      toast({
        title: "تم تحديث المنتج",
        description: "تم تحديث المنتج بنجاح",
      });
    } catch (error) {
      console.error('❌ Error in updateProduct:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 updateProduct completed');
    }
  };

  const deleteProduct = async (id: string) => {
    console.log('🗑️ Starting deleteProduct with id:', id);
    setLoading(true);
    
    try {
      // Check current user/session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('👤 Current session for delete:', { session: session?.session?.user?.id, error: sessionError });
      
      console.log('📡 Making request to delete product...');
      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .select();

      console.log('📡 Delete response:', { data, error, deletedRows: data?.length });
      
      if (error) {
        console.error('❌ Delete error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('✅ Product deleted successfully:', data);
      await fetchProducts();
      
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح",
      });
    } catch (error) {
      console.error('❌ Error in deleteProduct:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المنتج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 deleteProduct completed');
    }
  };

  useEffect(() => {
    console.log('🚀 useProducts hook initialized, calling fetchProducts...');
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    fetchProducts
  };
};
