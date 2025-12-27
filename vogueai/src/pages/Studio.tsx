import { useState, useCallback, useEffect } from "react";
import { LayoutGrid, User, Shirt, Sparkles, Loader2, Wand2, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import DropZone from "../components/DropZone";
import { useCredits } from "../context/CreditsContext";
import {
  generateUploadURL,
  uploadToS3,
  confirmUpload,
  pollJobStatus,
} from "../services/uploadService";

type LoadingStatus = "uploading" | "processing" | "generating" | null;

export default function Studio() {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<File | null>(null);
  const [outfitImagePreview, setOutfitImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [_, setStatusMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { refreshBalance } = useCredits();

  // Handle payment callback from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get("payment");

    if (payment === "success") {
      showSuccess("Payment successful! Your credits have been added.");
      refreshBalance();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "cancelled") {
      setError("Payment was cancelled");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refreshBalance]);

  // Clear success message after 3 seconds
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle user photo upload
  const handleUserUpload = useCallback((file: File) => {
    setUserImage(file);
    setUserImagePreview(URL.createObjectURL(file));
    setError(null);
    showSuccess("Photo uploaded successfully!");
  }, []);

  // Handle outfit image upload
  const handleOutfitUpload = useCallback((file: File) => {
    setOutfitImage(file);
    setOutfitImagePreview(URL.createObjectURL(file));
    setError(null);
    showSuccess("Outfit uploaded successfully!");
  }, []);

  // Confirm upload mutation
  const { mutate: confirmUploadMutation } = useMutation({
    mutationFn: confirmUpload,
    onSuccess: async (data) => {
      const { job_id } = data.data;
      setLoadingStatus("generating");
      setStatusMessage("Processing started! AI is working its magic...");

      try {
        // Poll for job completion
        const resultUrl = await pollJobStatus(job_id, (status) => {
          if (status === "pending") {
            setStatusMessage("Job queued, waiting to start...");
          } else if (status === "processing") {
            setStatusMessage("AI is generating your virtual try-on...");
            setProgress((p) => Math.min(p + 10, 90));
          }
        });

        if (resultUrl) {
          setGeneratedImage(resultUrl);
          setProgress(100);
          setStatusMessage("Virtual try-on generated successfully!");
        }
      } catch (err) {
        setError("Generation failed. Please try again.");
        setStatusMessage("");
      } finally {
        setLoadingStatus(null);
      }
    },
    onError: (error) => {
      console.error("Error confirming upload:", error);
      setError("Failed to process images. Please try again.");
      setStatusMessage("");
      setLoadingStatus(null);
    },
  });

  // Generate upload URLs mutation
  const { mutate: generateUploadMutation } = useMutation({
    mutationFn: generateUploadURL,
    onSuccess: async (data) => {
      try {
        const { avatar, outfit } = data.data;
        setLoadingStatus("uploading");
        setStatusMessage("Uploading your images to cloud...");
        setProgress(10);

        // Upload both images to S3
        await Promise.all([
          uploadToS3({ upload_url: avatar.upload_url, file: userImage! }),
          uploadToS3({ upload_url: outfit.upload_url, file: outfitImage! }),
        ]);

        setProgress(40);
        setStatusMessage("Images uploaded! Starting processing...");
        setLoadingStatus("processing");

        // Confirm upload and start processing
        confirmUploadMutation({
          avatar_key: avatar.key,
          outfit_key: outfit.key,
        });
      } catch (error) {
        console.error("Error uploading images:", error);
        setError("Failed to upload images. Please try again.");
        setStatusMessage("");
        setLoadingStatus(null);
      }
    },
    onError: (error) => {
      console.error("Error generating upload URLs:", error);
      setError("Failed to start upload. Please try again.");
      setStatusMessage("");
      setLoadingStatus(null);
    },
  });

  // Handle generate button click
  const handleGenerate = () => {
    if (!userImage || !outfitImage) {
      setError("Please upload both images before generating");
      return;
    }

    setError(null);
    setGeneratedImage(null);
    setProgress(0);
    setStatusMessage("Preparing upload...");

    generateUploadMutation({
      avatar_filename: userImage.name,
      outfit_filename: outfitImage.name,
      avatar_content_type: userImage.type || "image/jpeg",
      outfit_content_type: outfitImage.type || "image/jpeg",
    });
  };

  // Handle download
  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = "virtual-try-on-result.png";
      link.click();
      showSuccess("Image downloaded!");
    }
  };

  const canGenerate = userImage && outfitImage && !loadingStatus;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8 h-full min-h-[calc(100vh-120px)] animate-fade-in fade-in duration-500">
      {/* LEFT PANEL - Upload Section */}
      <div className="space-y-4 lg:space-y-6 flex-shrink-0">
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl lg:rounded-3xl p-4 lg:p-6 backdrop-blur-md">
          <h3 className="text-white font-semibold mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
            <LayoutGrid size={16} className="lg:w-[18px] lg:h-[18px]" /> Input Assets
          </h3>

          {/* Mobile: Side by side, Desktop: Stacked */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
            <div>
              <label className="text-[10px] lg:text-xs text-slate-500 uppercase font-bold">Model</label>
              <DropZone
                icon={User}
                label="Upload Photo"
                active={!!userImage}
                preview={userImagePreview}
                onFileSelect={handleUserUpload}
              />
            </div>

            <div>
              <label className="text-[10px] lg:text-xs text-slate-500 uppercase font-bold">Outfit</label>
              <DropZone
                icon={Shirt}
                label="Upload Outfit"
                active={!!outfitImage}
                preview={outfitImagePreview}
                onFileSelect={handleOutfitUpload}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 lg:p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs lg:text-sm">
            <AlertCircle size={14} className="lg:w-4 lg:h-4 flex-shrink-0" />
            <span className="line-clamp-2">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-2.5 lg:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs lg:text-sm animate-fade-in">
            <CheckCircle2 size={14} className="lg:w-4 lg:h-4 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-3 lg:py-4 rounded-xl font-bold text-base lg:text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
            !canGenerate
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:opacity-90 active:scale-[0.98]"
          }`}
        >
          {loadingStatus ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 lg:w-5 lg:h-5" /> Processing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 lg:w-5 lg:h-5" /> Generate Fit
            </>
          )}
        </button>
      </div>

      {/* RIGHT PANEL - Result Section */}
      <div className="lg:col-span-2 relative flex-1 flex items-center justify-center bg-slate-900/50 border border-white/10 rounded-2xl lg:rounded-3xl overflow-hidden backdrop-blur-md min-h-[250px] lg:min-h-[500px]">
        {!generatedImage && !loadingStatus && (
          <div className="text-center p-6 lg:p-8 flex flex-col items-center justify-center">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>
            
            {/* Main content */}
            <div className="relative z-10">
              <div className="size-16 lg:size-20 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 border border-violet-500/20">
                <Sparkles size={28} className="lg:w-9 lg:h-9 text-violet-400" />
              </div>
              <h3 className="text-lg lg:text-xl text-white font-medium mb-2">Ready to Create</h3>
              <p className="text-slate-400 text-xs lg:text-sm max-w-[200px] mx-auto">Upload your photo and outfit to generate a virtual try-on</p>
              
              {/* Visual hint for mobile */}
              <div className="mt-6 flex items-center justify-center gap-3 text-slate-500">
                <div className="flex items-center gap-1.5 text-[10px] lg:text-xs">
                  <div className="size-5 lg:size-6 rounded-lg bg-slate-800 flex items-center justify-center">
                    <User size={12} className="lg:w-3.5 lg:h-3.5" />
                  </div>
                  <span>+</span>
                  <div className="size-5 lg:size-6 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Shirt size={12} className="lg:w-3.5 lg:h-3.5" />
                  </div>
                  <span className="ml-1">=</span>
                  <div className="size-5 lg:size-6 rounded-lg bg-gradient-to-r from-violet-600/50 to-purple-600/50 flex items-center justify-center">
                    <Sparkles size={12} className="lg:w-3.5 lg:h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingStatus && (
          <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center backdrop-blur-sm z-10 p-4">
            <div className="flex flex-col items-center gap-4 lg:gap-6 w-full max-w-md">
              {/* Step indicators - Vertical on mobile, Horizontal on desktop */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Step 1: Uploading */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <div className={`size-7 lg:size-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                    loadingStatus === "uploading" 
                      ? "bg-violet-500 ring-2 ring-violet-400/50" 
                      : progress >= 40 
                        ? "bg-violet-500/80" 
                        : "bg-slate-700"
                  }`}>
                    {loadingStatus === "uploading" ? (
                      <Loader2 size={12} className="lg:w-3.5 lg:h-3.5 text-white animate-spin" />
                    ) : progress >= 40 ? (
                      <CheckCircle2 size={12} className="lg:w-3.5 lg:h-3.5 text-white" />
                    ) : (
                      <span className="text-[10px] lg:text-xs text-slate-400">1</span>
                    )}
                  </div>
                  <span className={`text-[11px] lg:text-xs font-medium ${loadingStatus === "uploading" ? "text-violet-300" : progress >= 40 ? "text-slate-300" : "text-slate-500"}`}>
                    Upload
                  </span>
                </div>

                <div className={`hidden sm:block w-6 lg:w-8 h-px ${progress >= 40 ? "bg-violet-500/50" : "bg-slate-700"}`} />

                {/* Step 2: Extracting Outfit */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <div className={`size-7 lg:size-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                    loadingStatus === "processing" 
                      ? "bg-purple-500 ring-2 ring-purple-400/50" 
                      : progress >= 90 
                        ? "bg-purple-500/80" 
                        : "bg-slate-700"
                  }`}>
                    {loadingStatus === "processing" ? (
                      <Loader2 size={12} className="lg:w-3.5 lg:h-3.5 text-white animate-spin" />
                    ) : progress >= 90 ? (
                      <CheckCircle2 size={12} className="lg:w-3.5 lg:h-3.5 text-white" />
                    ) : (
                      <span className="text-[10px] lg:text-xs text-slate-400">2</span>
                    )}
                  </div>
                  <span className={`text-[11px] lg:text-xs font-medium ${loadingStatus === "processing" ? "text-purple-300" : progress >= 90 ? "text-slate-300" : "text-slate-500"}`}>
                    Extract
                  </span>
                </div>

                <div className={`hidden sm:block w-6 lg:w-8 h-px ${progress >= 90 ? "bg-purple-500/50" : "bg-slate-700"}`} />

                {/* Step 3: Applying Outfit */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <div className={`size-7 lg:size-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                    loadingStatus === "generating" 
                      ? "bg-cyan-500 ring-2 ring-cyan-400/50" 
                      : progress >= 100 
                        ? "bg-cyan-500/80" 
                        : "bg-slate-700"
                  }`}>
                    {loadingStatus === "generating" ? (
                      <Loader2 size={12} className="lg:w-3.5 lg:h-3.5 text-white animate-spin" />
                    ) : progress >= 100 ? (
                      <CheckCircle2 size={12} className="lg:w-3.5 lg:h-3.5 text-white" />
                    ) : (
                      <span className="text-[10px] lg:text-xs text-slate-400">3</span>
                    )}
                  </div>
                  <span className={`text-[11px] lg:text-xs font-medium ${loadingStatus === "generating" ? "text-cyan-300" : progress >= 100 ? "text-slate-300" : "text-slate-500"}`}>
                    Apply
                  </span>
                </div>
              </div>

              {/* Current status text */}
              <p className="text-slate-400 text-xs lg:text-sm text-center">
                {loadingStatus === "uploading" && "Uploading images..."}
                {loadingStatus === "processing" && "Extracting outfit details..."}
                {loadingStatus === "generating" && "Applying outfit to your photo..."}
              </p>
            </div>
          </div>
        )}


        {generatedImage && !loadingStatus && (
          <div className="absolute inset-0 p-4 lg:p-6 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Generated Image */}
              <img
                src={generatedImage}
                alt="Generated virtual try-on"
                className="max-w-full max-h-full object-contain rounded-xl lg:rounded-2xl shadow-2xl"
              />
              
              {/* Download button */}
              <button
                onClick={handleDownload}
                className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 p-2.5 lg:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all z-20 flex items-center gap-2 active:scale-95"
                title="Download result"
              >
                <Download size={18} className="lg:w-5 lg:h-5 text-white" />
              </button>

              {/* Success badge */}
              <div className="absolute top-3 left-3 lg:top-4 lg:left-4 flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1 lg:py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-md">
                <CheckCircle2 size={12} className="lg:w-3.5 lg:h-3.5 text-emerald-400" />
                <span className="text-emerald-300 text-[10px] lg:text-xs font-medium">Generated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
