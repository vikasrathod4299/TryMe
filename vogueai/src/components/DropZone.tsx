
import { useState, useRef } from "react";
import { Camera, Check } from "lucide-react";

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
      ${active 
        ? "ring-2 ring-violet-500/50 bg-gradient-to-b from-violet-500/10 to-purple-500/5" 
        : "hover:bg-slate-800/50 hover:border-slate-600"
      }
      ${isDragging ? "scale-[1.02] ring-2 ring-cyan-400 bg-cyan-400/10 border-cyan-400" : ""}
      border border-slate-700/50 rounded-xl sm:rounded-xl lg:rounded-2xl
      flex flex-col items-center justify-center aspect-square sm:aspect-[3/4] w-full backdrop-blur-sm overflow-hidden`}
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
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <Camera size={14} className="text-white" />
              <span className="text-white text-xs font-medium">Change</span>
            </div>
          </div>
          {/* Success indicator */}
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <Check size={14} className="text-white" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-3 sm:p-4">
          {/* Icon container */}
          <div
            className={`p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 lg:mb-4 transition-all duration-300
            ${
              isDragging
                ? "bg-cyan-500/20 text-cyan-400 scale-110"
                : "bg-slate-800/80 text-slate-400 group-hover:text-violet-400 group-hover:bg-violet-500/20 group-hover:scale-105"
            }`}
          >
            <Icon size={20} className="sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
          </div>
          
          {/* Label */}
          <h3 className={`font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm lg:text-base transition-colors ${
            isDragging ? "text-cyan-300" : "text-white group-hover:text-violet-300"
          }`}>
            {label}
          </h3>
          
          {/* Subtitle */}
          <p className="text-slate-500 text-[10px] sm:text-[11px] lg:text-xs text-center max-w-[100px] sm:max-w-[120px]">
            <span className="hidden sm:inline">Drag & drop or </span>
            <span className="text-slate-400">Tap to upload</span>
          </p>
          
          {/* Supported formats hint */}
          <p className="text-slate-600 text-[10px] mt-2 hidden lg:block">
            JPG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  );
}
