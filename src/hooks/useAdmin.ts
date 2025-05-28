import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminUser, AdminConfig } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if admin is already logged in (simple localStorage check)
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
    
    // Enhanced debugging - log input parameters
    console.log('🚀 Starting admin login process');
    console.log('📧 Original email input:', email);
    console.log('🔤 Email length:', email.length);
    console.log('🔒 Password provided:', password ? 'Yes' : 'No');
    console.log('🔒 Password length:', password.length);
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log('📧 Normalized email:', normalizedEmail);
    console.log('📧 Email changed during normalization:', email !== normalizedEmail ? 'Yes' : 'No');
    
    try {
      // Debug: Check what's actually in the database
      console.log('🔍 Checking all admin users in database...');
      const { data: allAdmins, error: debugError } = await supabase
        .from('admin_users')
        .select('id, email, created_at');
      
      if (debugError) {
        console.error('❌ Error fetching all admins for debug:', debugError);
      } else {
        console.log('📊 All admin users in database:', allAdmins);
        console.log('📊 Total admin count:', allAdmins?.length || 0);
        allAdmins?.forEach((admin, index) => {
          console.log(`👤 Admin ${index + 1}:`, {
            id: admin.id,
            email: admin.email,
            emailLength: admin.email?.length,
            created_at: admin.created_at
          });
        });
      }

      // Query for admin user with exact email match
      console.log('🔍 Querying for specific admin user...');
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
        console.error('❌ Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "خطأ في الاتصال",
          description: "حدث خطأ أثناء الاتصال بقاعدة البيانات",
          variant: "destructive",
        });
        return false;
      }

      // Enhanced debugging of the query result
      if (adminUsers) {
        console.log('✅ Query executed successfully');
        console.log('📊 Raw adminUsers data:', adminUsers);
        console.log('📊 AdminUsers array length:', adminUsers.length);
        console.log('📊 AdminUsers is array:', Array.isArray(adminUsers));
        
        adminUsers.forEach((user, index) => {
          console.log(`👤 Admin user ${index}:`, {
            id: user.id,
            email: user.email,
            has_password_hash: !!user.password_hash,
            password_hash_length: user.password_hash?.length,
            created_at: user.created_at,
            all_fields: Object.keys(user)
          });
        });
      }

      // Get the first admin user from the results
      const adminUser = adminUsers && adminUsers.length > 0 ? adminUsers[0] : null;

      if (!adminUser) {
        console.log('❌ No admin user found');
        console.log('🔍 Search criteria:', { email: normalizedEmail });
        console.log('🔍 Available emails in database:', allAdmins?.map(a => a.email));
        
        // Check for case sensitivity issues
        const caseInsensitiveMatch = allAdmins?.find(admin => 
          admin.email.toLowerCase() === normalizedEmail
        );
        
        if (caseInsensitiveMatch) {
          console.log('⚠️ Found case-insensitive match:', caseInsensitiveMatch);
        } else {
          console.log('❌ No case-insensitive match found either');
        }
        
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "البريد الإلكتروني غير مسجل",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Admin user found, proceeding with password verification...');
      console.log('👤 Found admin user details:', {
        id: adminUser.id,
        email: adminUser.email,
        has_password_hash: !!adminUser.password_hash,
        password_hash_type: typeof adminUser.password_hash,
        password_hash_length: adminUser.password_hash?.length,
        created_at: adminUser.created_at
      });

      // Enhanced password verification with debugging
      if (!adminUser.password_hash) {
        console.error('❌ Admin user has no password_hash field');
        console.log('📊 Available fields on admin user:', Object.keys(adminUser));
        toast({
          title: "خطأ في النظام",
          description: "خطأ في إعدادات كلمة المرور",
          variant: "destructive",
        });
        return false;
      }

      console.log('🔒 Password verification:');
      console.log('🔒 Stored password hash exists:', !!adminUser.password_hash);
      console.log('🔒 Entered password exists:', !!password);
      console.log('🔒 Password comparison will be:', adminUser.password_hash, '===', password);

      if (adminUser.password_hash !== password) {
        console.log('❌ Password mismatch');
        console.log('🔒 Expected:', adminUser.password_hash);
        console.log('🔒 Received:', password);
        console.log('🔒 Lengths match:', adminUser.password_hash.length === password.length);
        console.log('🔒 Types match:', typeof adminUser.password_hash === typeof password);
        
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "كلمة المرور غير صحيحة",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Password verification successful!');
      console.log('✅ Login process completed successfully');
      
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
      console.error('💥 Error type:', typeof error);
      console.error('💥 Error constructor:', error?.constructor?.name);
      
      if (error instanceof Error) {
        console.error('💥 Error message:', error.message);
        console.error('💥 Error stack:', error.stack);
      }
      
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

export const useAdminConfig = () => {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConfig = async () => {
    try {
      console.log('🔄 Fetching admin config...');
      const { data, error } = await supabase
        .from('admin_config')
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error fetching config:', error);
        throw error;
      }
      
      console.log('✅ Admin config fetched:', data);
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const updateConfig = async (updates: Partial<AdminConfig>) => {
    setLoading(true);
    console.log('🔄 Starting updateConfig with updates:', updates);
    
    try {
      // Step 1: Check if a config record exists
      console.log('🔍 Step 1: Checking for existing config...');
      const { data: existingConfig, error: fetchError } = await supabase
        .from('admin_config')
        .select('*');

      console.log('📊 Existing config fetch result:', {
        data: existingConfig,
        error: fetchError,
        dataLength: existingConfig?.length,
        errorCode: fetchError?.code
      });

      if (fetchError) {
        console.error('❌ Error fetching existing config:', fetchError);
        throw fetchError;
      }

      let result;
      
      if (!existingConfig || existingConfig.length === 0) {
        // No config exists, create one
        console.log('📝 Step 2a: No config found, creating new one...');
        console.log('📝 Creating with data:', updates);
        
        result = await supabase
          .from('admin_config')
          .insert([updates])
          .select()
          .single();
          
        console.log('📝 Insert result:', result);
      } else {
        // Config exists, update it
        const configToUpdate = existingConfig[0];
        console.log('🔄 Step 2b: Config found, updating existing one...');
        console.log('🔄 Existing config:', configToUpdate);
        console.log('🔄 Update data:', updates);
        console.log('🔄 Config ID to update:', configToUpdate.id);
        
        // Try the update with extensive debugging
        console.log('🔄 Executing update query...');
        result = await supabase
          .from('admin_config')
          .update(updates)
          .eq('id', configToUpdate.id)
          .select();
          
        console.log('🔄 Raw update result:', result);
        console.log('🔄 Update result data:', result.data);
        console.log('🔄 Update result error:', result.error);
        console.log('🔄 Update result data length:', result.data?.length);
        
        // Check if we got exactly one row back
        if (result.data && result.data.length === 1) {
          console.log('✅ Update successful, converting to single result');
          result.data = result.data[0];
        } else if (result.data && result.data.length === 0) {
          console.error('❌ Update returned 0 rows - this means the WHERE condition didn\'t match');
          console.log('🔍 Let\'s verify the ID exists in the database...');
          
          const { data: verifyData, error: verifyError } = await supabase
            .from('admin_config')
            .select('*')
            .eq('id', configToUpdate.id);
            
          console.log('🔍 ID verification result:', { verifyData, verifyError });
          
          throw new Error(`Update returned 0 rows. Config ID ${configToUpdate.id} might not exist.`);
        } else if (result.data && result.data.length > 1) {
          console.error('❌ Update returned multiple rows:', result.data.length);
          throw new Error(`Update returned ${result.data.length} rows, expected 1.`);
        }
      }

      if (result.error) {
        console.error('❌ Error in database operation:', result.error);
        console.error('❌ Error details:', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint
        });
        throw result.error;
      }
      
      console.log('✅ Final result data:', result.data);
      console.log('✅ Admin config updated successfully');
      setConfig(result.data);
      
      return result.data;
    } catch (error) {
      console.error('💥 Error updating config:', error);
      console.error('💥 Error type:', typeof error);
      console.error('💥 Error constructor:', error?.constructor?.name);
      
      if (error instanceof Error) {
        console.error('💥 Error message:', error.message);
        console.error('💥 Error stack:', error.stack);
      }
      
      throw error;
    } finally {
      setLoading(false);
      console.log('🏁 updateConfig process finished');
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    updateConfig,
    fetchConfig
  };
};
