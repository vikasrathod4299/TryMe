import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  placeholder?: string;
  accept?: string;
  className?: string;
}

const ImageUploadZone = ({
  onFileSelect,
  selectedFile,
  placeholder = "Drop your image here or click to upload",
  accept = "image/*",
  className,
}: ImageUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        onFileSelect(imageFiles[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const removeFile = useCallback(() => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn("relative", className)}>
      {previewUrl ? (
        <div className="relative group">
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-card border-2 border-primary/20">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
        </div>
      ) : (
        <div
          className={cn(
            "aspect-[3/4] rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer",
            "bg-gradient-upload hover:bg-secondary/30",
            isDragOver
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-primary/30 hover:border-primary/60",
            className
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              {isDragOver ? (
                <Upload className="h-8 w-8 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-8 w-8 text-primary" />
              )}
            </div>
            <p className="text-foreground font-medium mb-2">
              {isDragOver ? "Drop your image here" : placeholder}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports JPG, PNG, WEBP up to 10MB
            </p>
            <Button variant="upload" size="sm" onClick={triggerFileSelect}>
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploadZone;