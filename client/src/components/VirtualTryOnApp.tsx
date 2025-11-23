import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Wand2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";
import GeneratedImageDisplay from "./GeneratedImageDisplay";
import Navigation from "./Navigation";
import { useMutation } from "@tanstack/react-query";
import { confirmUpload, generateUploadURL, getJobStatus, uploadToS3 } from "@/service/upload";

const VirtualTryOnApp = () => {
  const [outfitUrl, setOutfitUrl ] = useState<string | null>(null);
  const [userUrl, setUserUrl ] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<File | null>(null);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<'uploading' | 'generating' | null>(null);

  const handleOutfitUpload = useCallback((file: File) => {
    setOutfitImage(file);
    toast.success("Outfit image uploaded successfully!");
  }, []);

  const handleUserUpload = useCallback((file: File) => {
    setUserImage(file);
    toast.success("Your photo uploaded successfully!");
  }, []);

  const { mutate: confirmUploadFn} = useMutation({
    mutationFn: confirmUpload,
    onSuccess: (data) => {
     const { avatar_url, outfit_url, job_id } =  data.data;
     setUserUrl(avatar_url);
     setOutfitUrl(outfit_url);
     setLoadingStatus('generating');
      toast.success("Images uploaded successfully! Generating virtual try-on...");
      pollJobStatus(job_id);
      setLoadingStatus(null);
    },
    onError: (error) => {
      console.error("Error confirming upload:", error);
      toast.error("Failed to confirm upload. Please try again.");
    }
  });


  const {mutate:generateUploadUrl} = useMutation({
    mutationFn: generateUploadURL,
    onSuccess: async (data) => {
      try {
        const { avatar, outfit } = data.data;
        setLoadingStatus('uploading');
        await uploadToS3({ upload_url: avatar.upload_url, file: userImage! });
        await uploadToS3({ upload_url: outfit.upload_url, file: outfitImage! });
        confirmUploadFn({ avatar_key: avatar.key, outfit_key: outfit.key });
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error("Failed to upload images. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Error generating upload URLs:", error);
      toast.error("Failed to generate upload URLs. Please try again.");
    }
  });



  const generateTryOn = async () => {
    if (!outfitImage || !userImage) {
      toast.error("Please upload both images before generating");
      return;
    }

    try {
      generateUploadUrl({avatar_filename: userImage.name, outfit_filename: outfitImage.name});

      toast.success("Virtual try-on generated successfully!");
    } catch (error) {
      toast.error("Failed to generate virtual try-on. Please try again.");
    } finally {
      setLoadingStatus(null);
    }
  };

  async function pollJobStatus(jobId) {
    let loading = true;
    while (loading) {
      const res = await getJobStatus(jobId);
      const { data } = res;

      if (data.status === "completed") {
        loading = false;
        setGeneratedImage(data.result_url);
      } else if (data.status === "failed") {
        loading = false;
        //showError("Job failed, please try again.");
      } else {
        await new Promise(r => setTimeout(r, 3000)); // wait 3s
      }
    }
  }


  const canGenerate = outfitImage && userImage && !loadingStatus;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-primary rounded-2xl shadow-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Virtual Try-On
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your photo and an outfit image to see how the clothes would look on you using advanced AI
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Outfit Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadZone
                onFileSelect={handleOutfitUpload}
                selectedFile={outfitImage}
                placeholder="Upload the outfit or clothing you want to try on"
                accept="image/*"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Your Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploadZone
                onFileSelect={handleUserUpload}
                selectedFile={userImage}
                placeholder="Upload a clear photo of yourself"
                accept="image/*"
              />
            </CardContent>
          </Card>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-12">
          <Button
            variant="generate"
            size="lg"
            onClick={generateTryOn}
            disabled={!canGenerate}
            className="text-lg px-12 py-4 h-auto"
          >
            {loadingStatus === 'generating' ? (
              <>
                <Wand2 className="h-6 w-6 animate-spin" />
                Generating Magic...
              </>
            ) : (
              <>
                <Wand2 className="h-6 w-6" />
                Generate Virtual Try-On
              </>
            )}
            {
              loadingStatus === 'uploading' && <span className="ml-3">(Uploading Images...)</span>
            }
          </Button>
        </div>

        {/* Result Section */}
        {(generatedImage || loadingStatus === 'generating') && (
          <GeneratedImageDisplay
            generatedImage={generatedImage}
            isGenerating={loadingStatus === 'generating'}
            onDownload={() => {
              if (generatedImage) {
                const link = document.createElement("a");
                link.href = generatedImage;
                link.download = "virtual-try-on-result.png";
                link.click();
              }
            }}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOnApp;