
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminConfig } from '@/types/admin';

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
