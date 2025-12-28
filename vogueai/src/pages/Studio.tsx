import { useState, useCallback, useEffect } from "react";
import { Upload, User, Shirt, Sparkles, Loader2, Download, AlertCircle, CheckCircle2, ImageIcon, ArrowRight, Zap } from "lucide-react";
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
    <div className="min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-120px)] animate-fade-in pb-6">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Compact on mobile */}
        <div className="text-center mb-4 sm:mb-8 lg:mb-12">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-1 sm:mb-3">
            Virtual Try-On <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Studio</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm lg:text-base max-w-md mx-auto hidden sm:block">
            Upload your photo and any outfit to see how it looks on you instantly
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10">
          
          {/* LEFT: Upload Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Upload Cards Container */}
            <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-8 backdrop-blur-xl">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <Upload size={16} className="sm:w-[18px] sm:h-[18px] text-violet-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm sm:text-base lg:text-lg">Upload Images</h3>
                  <p className="text-slate-500 text-[11px] sm:text-xs lg:text-sm hidden sm:block">Add your photo and the outfit you want to try</p>
                </div>
              </div>

              {/* Upload Grid - Always 2 columns */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {/* Your Photo */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-400 text-[10px] sm:text-xs font-bold">1</span>
                    </div>
                    <label className="text-xs sm:text-sm text-slate-300 font-medium">Your Photo</label>
                  </div>
                  <DropZone
                    icon={User}
                    label="Photo"
                    active={!!userImage}
                    preview={userImagePreview}
                    onFileSelect={handleUserUpload}
                  />
                </div>

                {/* Outfit */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 text-[10px] sm:text-xs font-bold">2</span>
                    </div>
                    <label className="text-xs sm:text-sm text-slate-300 font-medium">Outfit</label>
                  </div>
                  <DropZone
                    icon={Shirt}
                    label="Outfit"
                    active={!!outfitImage}
                    preview={outfitImagePreview}
                    onFileSelect={handleOutfitUpload}
                  />
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500/5 border border-red-500/20 rounded-lg sm:rounded-xl">
                <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-red-500/10 flex-shrink-0">
                  <AlertCircle size={14} className="sm:w-4 sm:h-4 text-red-400" />
                </div>
                <span className="text-red-300 text-xs sm:text-sm flex-1 line-clamp-2">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg sm:rounded-xl animate-fade-in">
                <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-emerald-500/10 flex-shrink-0">
                  <CheckCircle2 size={14} className="sm:w-4 sm:h-4 text-emerald-400" />
                </div>
                <span className="text-emerald-300 text-xs sm:text-sm">{successMessage}</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base lg:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 ${
                !canGenerate
                  ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white hover:shadow-lg hover:shadow-violet-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              }`}
            >
              {loadingStatus ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> 
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> 
                  <span>Generate</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              )}
            </button>

            {/* Info Note */}
            <p className="text-center text-slate-500 text-[10px] sm:text-xs">
              ✨ 1 credit • ~30 sec
            </p>
          </div>

          {/* RIGHT: Result Section */}
          <div className="relative flex items-stretch">
            <div className="w-full bg-gradient-to-b from-slate-800/30 to-slate-900/30 border border-slate-700/50 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden backdrop-blur-xl min-h-[280px] sm:min-h-[350px] lg:min-h-[550px] flex items-center justify-center">
              
              {/* Empty State */}
              {!generatedImage && !loadingStatus && (
                <div className="text-center p-4 sm:p-8 lg:p-12 flex flex-col items-center justify-center">
                  {/* Decorative elements - hidden on mobile for performance */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 left-10 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-56 h-56 bg-purple-500/5 rounded-full blur-3xl"></div>
                  </div>
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-6 border border-slate-700/50 shadow-xl">
                      <ImageIcon size={24} className="sm:w-9 sm:h-9 lg:w-11 lg:h-11 text-slate-500" />
                    </div>
                    
                    <h3 className="text-base sm:text-xl lg:text-2xl text-white font-semibold mb-1 sm:mb-3">Result Preview</h3>
                    <p className="text-slate-400 text-xs sm:text-sm lg:text-base max-w-xs mx-auto mb-4 sm:mb-8">
                      <span className="hidden sm:inline">Upload your photo and outfit, then click generate</span>
                      <span className="sm:hidden">Upload images and tap Generate</span>
                    </p>
                    
                    {/* Visual Steps - Simplified on mobile */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 text-slate-500">
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <User size={14} className="sm:w-4 sm:h-4 text-emerald-400" />
                        <span className="text-[10px] sm:text-xs text-slate-400">Photo</span>
                      </div>
                      <span className="text-slate-600 text-xs">+</span>
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <Shirt size={14} className="sm:w-4 sm:h-4 text-purple-400" />
                        <span className="text-[10px] sm:text-xs text-slate-400">Outfit</span>
                      </div>
                      <span className="text-slate-600 text-xs">=</span>
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                        <Sparkles size={14} className="sm:w-4 sm:h-4 text-violet-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingStatus && (
                <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center backdrop-blur-md z-10 p-4 sm:p-6">
                  <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-sm">
                    {/* Animated loader */}
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-slate-700"></div>
                      <div className="absolute inset-0 w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-transparent border-t-violet-500 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={18} className="sm:w-6 sm:h-6 text-violet-400" />
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="w-full space-y-2 sm:space-y-4">
                      {/* Step 1: Upload */}
                      <div className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                        loadingStatus === "uploading" ? "bg-violet-500/10 border border-violet-500/30" : 
                        progress >= 40 ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-slate-800/50 border border-slate-700/50"
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          loadingStatus === "uploading" ? "bg-violet-500" : 
                          progress >= 40 ? "bg-emerald-500" : "bg-slate-700"
                        }`}>
                          {loadingStatus === "uploading" ? (
                            <Loader2 size={18} className="text-white animate-spin" />
                          ) : progress >= 40 ? (
                            <CheckCircle2 size={18} className="text-white" />
                          ) : (
                            <Upload size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${loadingStatus === "uploading" ? "text-violet-300" : progress >= 40 ? "text-emerald-300" : "text-slate-400"}`}>
                            Uploading Images
                          </p>
                          <p className="text-xs text-slate-500">Sending to cloud</p>
                        </div>
                      </div>

                      {/* Step 2: Processing */}
                      <div className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                        loadingStatus === "processing" ? "bg-purple-500/10 border border-purple-500/30" : 
                        progress >= 90 ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-slate-800/50 border border-slate-700/50"
                      }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          loadingStatus === "processing" ? "bg-purple-500" : 
                          progress >= 90 ? "bg-emerald-500" : "bg-slate-700"
                        }`}>
                          {loadingStatus === "processing" ? (
                            <Loader2 size={18} className="text-white animate-spin" />
                          ) : progress >= 90 ? (
                            <CheckCircle2 size={18} className="text-white" />
                          ) : (
                            <Shirt size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${loadingStatus === "processing" ? "text-purple-300" : progress >= 90 ? "text-emerald-300" : "text-slate-400"}`}>
                            Analyzing
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">Extracting details</p>
                        </div>
                      </div>

                      {/* Step 3: Generating */}
                      <div className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                        loadingStatus === "generating" ? "bg-cyan-500/10 border border-cyan-500/30" : 
                        progress >= 100 ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-slate-800/50 border border-slate-700/50"
                      }`}>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                          loadingStatus === "generating" ? "bg-cyan-500" : 
                          progress >= 100 ? "bg-emerald-500" : "bg-slate-700"
                        }`}>
                          {loadingStatus === "generating" ? (
                            <Loader2 size={14} className="sm:w-[18px] sm:h-[18px] text-white animate-spin" />
                          ) : progress >= 100 ? (
                            <CheckCircle2 size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
                          ) : (
                            <Sparkles size={14} className="sm:w-[18px] sm:h-[18px] text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm font-medium ${loadingStatus === "generating" ? "text-cyan-300" : progress >= 100 ? "text-emerald-300" : "text-slate-400"}`}>
                            Generating
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">AI magic in progress</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Result State */}
              {generatedImage && !loadingStatus && (
                <div className="absolute inset-0 p-3 sm:p-4 lg:p-6 flex items-center justify-center bg-gradient-to-b from-slate-900/50 to-slate-900/80">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Generated Image */}
                    <img
                      src={generatedImage}
                      alt="Generated virtual try-on"
                      className="max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-white/10"
                    />
                    
                    {/* Download button */}
                    <button
                      onClick={handleDownload}
                      className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl transition-all z-20 border border-white/10 hover:border-white/20"
                      title="Download result"
                    >
                      <Download size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
                      <span className="text-white text-xs sm:text-sm font-medium">Save</span>
                    </button>

                    {/* Success badge */}
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 lg:top-6 lg:left-6 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg sm:rounded-xl backdrop-blur-md">
                      <CheckCircle2 size={12} className="sm:w-4 sm:h-4 text-emerald-400" />
                      <span className="text-emerald-300 text-[10px] sm:text-sm font-medium">Done</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
