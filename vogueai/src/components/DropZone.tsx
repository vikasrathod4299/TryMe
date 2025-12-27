
import { useState, useRef } from "react";

interface DropZoneProps {
  icon: any;
  label: string;
  active?: boolean;
  preview?: string | null;
  onFileSelect: (file: File) => void;
  accept?: string;
}

export default function DropZone({
  icon: Icon,
  label,
  active,
  preview,
  onFileSelect,
  accept = "image/*",
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 ease-out
      ${active ? "ring-2 ring-violet-500 bg-violet-500/10" : "hover:bg-white/5"}
      ${isDragging ? "scale-105 ring-2 ring-cyan-400 bg-cyan-400/10" : ""}
      border-2 border-dashed border-white/20 rounded-xl lg:rounded-2xl p-4 lg:p-8
      flex flex-col items-center justify-center h-32 sm:h-40 lg:h-64 w-full backdrop-blur-sm overflow-hidden`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      {preview ? (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-xs lg:text-sm font-medium">Change Image</p>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`p-2.5 lg:p-4 rounded-full mb-2 lg:mb-4 transition-colors duration-300
            ${
              isDragging
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-white/5 text-white/60 group-hover:text-violet-400 group-hover:bg-violet-500/20"
            }`}
          >
            <Icon size={20} className="lg:w-8 lg:h-8" />
          </div>
          <h3 className="text-white font-semibold mb-1 lg:mb-2 text-xs lg:text-base">{label}</h3>
          <p className="text-white/40 text-[10px] lg:text-sm text-center hidden sm:block">
            Drag & drop or click to upload
          </p>
          <p className="text-white/40 text-[10px] text-center sm:hidden">
            Tap to upload
          </p>
        </>
      )}
    </div>
  );
}
