import { useState, useCallback } from "react";
import { LayoutGrid, User, Shirt, Sparkles, Loader2, Wand2, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import DropZone from "../components/DropZone";
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
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    <div className="grid lg:grid-cols-3 gap-8 h-full animate-fade-in fade-in duration-500">
      {/* LEFT PANEL */}
      <div className="space-y-6">
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <LayoutGrid size={18} /> Input Assets
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Model</label>
              <DropZone
                icon={User}
                label="Upload Photo"
                active={!!userImage}
                preview={userImagePreview}
                onFileSelect={handleUserUpload}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Outfit</label>
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
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm animate-fade-in">
            <CheckCircle2 size={16} />
            {successMessage}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
            !canGenerate
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:opacity-90"
          }`}
        >
          {loadingStatus ? (
            <>
              <Loader2 className="animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Wand2 /> Generate Fit
            </>
          )}
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-2 relative flex items-center justify-center bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md min-h-[500px]">
        {!generatedImage && !loadingStatus && (
          <div className="text-center p-8">
            <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles size={36} className="text-violet-400" />
            </div>
            <h3 className="text-xl text-white font-medium">Ready to Create</h3>
            <p className="text-slate-500 text-sm mt-2">Upload your photo and outfit to get started</p>
          </div>
        )}

        {loadingStatus && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm z-10">
            <div className="w-80 space-y-4">
              {/* Animated spinner */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="size-16 rounded-full border-4 border-slate-700"></div>
                  <div className="absolute inset-0 size-16 rounded-full border-4 border-transparent border-t-violet-500 animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto size-6 text-violet-400" />
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-violet-300">PROGRESS</span>
                  <span className="text-cyan-300">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Live status message */}
              <div className="text-center space-y-2">
                <p className="text-white font-medium text-sm">
                  {statusMessage}
                </p>
                <p className="text-slate-500 text-xs">
                  This may take up to a minute...
                </p>
              </div>

              {/* Step indicators */}
              <div className="flex justify-center gap-6 pt-2">
                <div className={`flex flex-col items-center gap-1 ${progress >= 10 ? 'text-violet-400' : 'text-slate-600'}`}>
                  <div className={`size-2 rounded-full ${progress >= 10 ? 'bg-violet-400' : 'bg-slate-600'}`}></div>
                  <span className="text-xs">Upload</span>
                </div>
                <div className={`flex flex-col items-center gap-1 ${progress >= 40 ? 'text-purple-400' : 'text-slate-600'}`}>
                  <div className={`size-2 rounded-full ${progress >= 40 ? 'bg-purple-400' : 'bg-slate-600'}`}></div>
                  <span className="text-xs">Process</span>
                </div>
                <div className={`flex flex-col items-center gap-1 ${progress >= 90 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  <div className={`size-2 rounded-full ${progress >= 90 ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                  <span className="text-xs">Generate</span>
                </div>
              </div>
            </div>
          </div>
        )}


        {generatedImage && !loadingStatus && (
          <div className="absolute inset-0 p-6 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Generated Image */}
              <img
                src={generatedImage}
                alt="Generated virtual try-on"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
              
              {/* Download button */}
              <button
                onClick={handleDownload}
                className="absolute bottom-4 right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all z-20 flex items-center gap-2"
                title="Download result"
              >
                <Download size={20} className="text-white" />
              </button>

              {/* Success badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full backdrop-blur-md">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-emerald-300 text-xs font-medium">Generated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
