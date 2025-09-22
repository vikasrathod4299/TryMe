import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Wand2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ImageUploadZone from "./ImageUploadZone";
import GeneratedImageDisplay from "./GeneratedImageDisplay";
import Navigation from "./Navigation";

const VirtualTryOnApp = () => {
  const [outfitImage, setOutfitImage] = useState<File | null>(null);
  const [userImage, setUserImage] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleOutfitUpload = useCallback((file: File) => {
    setOutfitImage(file);
    toast.success("Outfit image uploaded successfully!");
  }, []);

  const handleUserUpload = useCallback((file: File) => {
    setUserImage(file);
    toast.success("Your photo uploaded successfully!");
  }, []);

  const generateTryOn = async () => {
    if (!outfitImage || !userImage) {
      toast.error("Please upload both images before generating");
      return;
    }

    setIsGenerating(true);
    try {
      // TODO: Integrate with Gemini Flash 2.5 API
      // For now, simulate the generation process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // This would be replaced with actual API call to Gemini Flash 2.5
      setGeneratedImage("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=600&fit=crop");
      toast.success("Virtual try-on generated successfully!");
    } catch (error) {
      toast.error("Failed to generate virtual try-on. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = outfitImage && userImage && !isGenerating;

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
            {isGenerating ? (
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
          </Button>
        </div>

        {/* Result Section */}
        {(generatedImage || isGenerating) && (
          <GeneratedImageDisplay
            generatedImage={generatedImage}
            isGenerating={isGenerating}
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