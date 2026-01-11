'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

type FileUploadProps = {
  onUpload: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  currentUrl?: string | null;
};

export function FileUpload({
  onUpload,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 5,
  label = 'Upload File',
  currentUrl,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success && result.data?.url) {
        setPreviewUrl(result.data.url);
        onUpload(result.data.url);
        toast.success('File uploaded successfully');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = previewUrl && previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
        aria-label={label}
      />

      {previewUrl && !uploading ? (
        <div className="relative rounded-lg border overflow-hidden">
          {isImage ? (
            <div className="relative aspect-video">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted">
              <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate flex-1">{previewUrl.split('/').pop()}</span>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`relative w-full rounded-lg border-2 border-dashed transition-colors ${
              uploading
                ? 'border-primary bg-primary/5 cursor-wait'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={uploading ? 'Uploading file' : 'Click to upload file'}
          >
            <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">Max file size: {maxSize}MB</p>
              </div>
            </div>
          </button>

          {uploading && (
            <div className="space-y-1" role="status" aria-live="polite">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">{progress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
