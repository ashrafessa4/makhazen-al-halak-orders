
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Link } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
}

const ImageUpload = ({ currentImage, onImageChange, label = "صورة المنتج" }: ImageUploadProps) => {
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(currentImage || '');
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImage, uploading } = useImageUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. يرجى اختيار صورة أصغر من 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the image
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      onImageChange(imageUrl);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setPreview(urlInput);
      onImageChange(urlInput);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setUrlInput('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      {/* Toggle between upload and URL */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!useUrl ? "default" : "outline"}
          size="sm"
          onClick={() => setUseUrl(false)}
          className="flex-1"
        >
          <Upload className="w-4 h-4 ml-1" />
          رفع صورة
        </Button>
        <Button
          type="button"
          variant={useUrl ? "default" : "outline"}
          size="sm"
          onClick={() => setUseUrl(true)}
          className="flex-1"
        >
          <Link className="w-4 h-4 ml-1" />
          رابط صورة
        </Button>
      </div>

      {!useUrl ? (
        // File upload mode
        <div className="space-y-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="border-2 border-gray-300 focus:border-barber-blue"
          />
          {uploading && (
            <p className="text-sm text-barber-blue">جاري رفع الصورة...</p>
          )}
        </div>
      ) : (
        // URL input mode
        <div className="flex gap-2">
          <Input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="border-2 border-gray-300 focus:border-barber-blue"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className="bg-barber-blue hover:bg-barber-blue/90"
          >
            إضافة
          </Button>
        </div>
      )}

      {/* Image preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="معاينة الصورة"
            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clearImage}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
