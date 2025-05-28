
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
    console.log('🔄 Updating admin config with:', updates);
    
    try {
      // Check if a config record exists
      const { data: existingConfig, error: fetchError } = await supabase
        .from('admin_config')
        .select('*');

      if (fetchError) {
        console.error('❌ Error fetching existing config:', fetchError);
        throw fetchError;
      }

      let result;
      
      if (!existingConfig || existingConfig.length === 0) {
        // No config exists, create one
        console.log('📝 Creating new admin config...');
        
        result = await supabase
          .from('admin_config')
          .insert([updates])
          .select()
          .single();
      } else {
        // Config exists, update it
        const configToUpdate = existingConfig[0];
        console.log('🔄 Updating existing admin config...');
        
        const { data, error } = await supabase
          .from('admin_config')
          .update(updates)
          .eq('id', configToUpdate.id)
          .select()
          .single();
          
        result = { data, error };
      }

      if (result.error) {
        console.error('❌ Error in database operation:', result.error);
        throw result.error;
      }
      
      console.log('✅ Admin config updated successfully:', result.data);
      setConfig(result.data);
      
      return result.data;
    } catch (error) {
      console.error('💥 Error updating config:', error);
      throw error;
    } finally {
      setLoading(false);
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
