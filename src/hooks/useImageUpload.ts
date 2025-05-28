
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    console.log('📸 Starting image upload for file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    setUploading(true);
    try {
      // Check current user/session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('👤 Current session for upload:', { session: session?.session?.user?.id, error: sessionError });
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      console.log('📁 Generated filename:', fileName);
      
      // Upload the file
      console.log('📡 Making request to upload file to storage...');
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      console.log('📡 Upload response:', { data, error });

      if (error) {
        console.error('❌ Upload error details:', {
          name: error.name,
          message: error.message
        });
        throw error;
      }

      // Get the public URL
      console.log('🔗 Getting public URL for uploaded file...');
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      console.log('✅ Image uploaded successfully. Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadImage:', error);
      toast({
        title: "خطأ في رفع الصورة",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      console.log('🏁 uploadImage completed');
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    console.log('🗑️ Starting image deletion for URL:', imageUrl);
    
    try {
      // Check current user/session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('👤 Current session for image delete:', { session: session?.session?.user?.id, error: sessionError });
      
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      console.log('📁 Extracted filename for deletion:', fileName);
      
      console.log('📡 Making request to delete file from storage...');
      const { error } = await supabase.storage
        .from('product-images')
        .remove([fileName]);

      console.log('📡 Delete response:', { error });

      if (error) {
        console.error('❌ Image delete error:', error);
        return false;
      }

      console.log('✅ Image deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in deleteImage:', error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading
  };
};
