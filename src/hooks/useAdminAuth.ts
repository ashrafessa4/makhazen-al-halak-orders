
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in
    const adminData = localStorage.getItem('admin_user');
    if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        console.log('🔍 Found existing admin session:', { id: parsedAdmin.id, email: parsedAdmin.email });
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ Error parsing stored admin data:', error);
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    console.log('🚀 Starting admin login process');
    console.log('📧 Email:', email);
    
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      // First, sign in as anonymous to access the database
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        console.error('❌ Anonymous auth error:', anonError);
      }

      // Query for admin user with exact email match
      console.log('🔍 Querying for admin user...');
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', normalizedEmail);

      console.log('📊 Database query result:', { 
        adminUsers, 
        error,
        queryEmail: normalizedEmail,
        resultCount: adminUsers?.length || 0
      });

      if (error) {
        console.error('❌ Database error:', error);
        toast({
          title: "خطأ في الاتصال",
          description: "حدث خطأ أثناء الاتصال بقاعدة البيانات",
          variant: "destructive",
        });
        return false;
      }

      // Get the first admin user from the results
      const adminUser = adminUsers && adminUsers.length > 0 ? adminUsers[0] : null;

      if (!adminUser) {
        console.log('❌ No admin user found');
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "البريد الإلكتروني غير مسجل",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Admin user found, proceeding with password verification...');

      if (!adminUser.password_hash) {
        console.error('❌ Admin user has no password_hash field');
        toast({
          title: "خطأ في النظام",
          description: "خطأ في إعدادات كلمة المرور",
          variant: "destructive",
        });
        return false;
      }

      if (adminUser.password_hash !== password) {
        console.log('❌ Password mismatch');
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Password verification successful!');
      
      // Update state and localStorage
      setAdmin(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('admin_user', JSON.stringify(adminUser));
      
      console.log('✅ Admin state updated and stored in localStorage');
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم",
      });

      // Refresh the page to ensure UI updates properly
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('💥 Unexpected login error:', error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
      console.log('🏁 Login process finished');
    }
  };

  const logout = () => {
    console.log('🚪 Admin logout initiated');
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin_user');
    
    // Sign out from Supabase as well
    supabase.auth.signOut();
    
    console.log('✅ Admin logout completed');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });

    // Refresh the page to ensure UI updates properly
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return {
    isAuthenticated,
    admin,
    loading,
    login,
    logout
  };
};
