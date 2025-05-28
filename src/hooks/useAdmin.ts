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
        
        // Debug: Let's check the exact field names and values
        console.log('🔍 Debugging update data:');
        console.log('🔍 Updates object keys:', Object.keys(updates));
        console.log('🔍 Updates object values:', Object.values(updates));
        console.log('🔍 notification_email in updates:', updates.notification_email);
        console.log('🔍 typeof notification_email:', typeof updates.notification_email);
        console.log('🔍 notification_email === null:', updates.notification_email === null);
        console.log('🔍 notification_email === undefined:', updates.notification_email === undefined);
        console.log('🔍 notification_email length:', updates.notification_email?.length);
        
        // Let's also check the database schema expectation
        console.log('🔍 Current config notification_email:', configToUpdate.notification_email);
        console.log('🔍 Current config notification_email type:', typeof configToUpdate.notification_email);
        
        // Try a simpler update first - just the email field
        console.log('🔄 Testing email-only update first...');
        const emailOnlyUpdate = { notification_email: updates.notification_email };
        console.log('🔄 Email-only update data:', emailOnlyUpdate);
        
        // First, perform the update
        const updateResult = await supabase
          .from('admin_config')
          .update(emailOnlyUpdate)
          .eq('id', configToUpdate.id);
          
        console.log('🔄 Email-only update operation result:', updateResult);
        console.log('🔄 Update status:', updateResult.status);
        console.log('🔄 Update count:', updateResult.count);
        console.log('🔄 Update error:', updateResult.error);
        
        if (updateResult.error) {
          console.error('❌ Email-only update operation failed:', updateResult.error);
          throw updateResult.error;
        }
        
        // Check if any rows were affected
        if (updateResult.count === 0) {
          console.error('❌ No rows were updated! This indicates the WHERE clause didn\'t match.');
          throw new Error('No rows were updated. The record might not exist or the WHERE clause failed.');
        }
        
        console.log('✅ Email update count:', updateResult.count);
        
        // Now update the WhatsApp number as well
        console.log('🔄 Now updating WhatsApp number...');
        const fullUpdateResult = await supabase
          .from('admin_config')
          .update(updates)
          .eq('id', configToUpdate.id);
          
        console.log('🔄 Full update operation result:', fullUpdateResult);
        
        if (fullUpdateResult.error) {
          console.error('❌ Full update operation failed:', fullUpdateResult.error);
          throw fullUpdateResult.error;
        }
        
        // Then fetch the updated record to verify
        console.log('🔍 Fetching updated record to verify changes...');
        const fetchResult = await supabase
          .from('admin_config')
          .select('*')
          .eq('id', configToUpdate.id)
          .single();
          
        console.log('📊 Fetch updated record result:', fetchResult);
        console.log('📊 Updated notification_email:', fetchResult.data?.notification_email);
        console.log('📊 Updated whatsapp_number:', fetchResult.data?.whatsapp_number);
        
        if (fetchResult.error) {
          console.error('❌ Error fetching updated record:', fetchResult.error);
          throw fetchResult.error;
        }
        
        // Verify that the email was actually updated
        if (fetchResult.data?.notification_email !== updates.notification_email) {
          console.error('❌ Email update verification failed!');
          console.error('❌ Expected:', updates.notification_email);
          console.error('❌ Actual:', fetchResult.data?.notification_email);
          throw new Error('Email update verification failed. The database value does not match the expected value.');
        }
        
        console.log('✅ Email update verification successful!');
        result = fetchResult;
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
