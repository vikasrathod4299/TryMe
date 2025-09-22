import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Sparkles, Loader2 } from "lucide-react";

interface GeneratedImageDisplayProps {
  generatedImage: string | null;
  isGenerating: boolean;
  onDownload: () => void;
}

const GeneratedImageDisplay = ({
  generatedImage,
  isGenerating,
  onDownload,
}: GeneratedImageDisplayProps) => {
  return (
    <Card className="bg-gradient-card border-primary/20 shadow-card max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center justify-center">
          <Sparkles className="h-5 w-5" />
          Your Virtual Try-On Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-upload relative">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="p-6 bg-primary/10 rounded-full mb-6">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">AI Magic in Progress</h3>
              <p className="text-muted-foreground max-w-md">
                Our advanced AI is analyzing your images and creating your personalized virtual try-on...
              </p>
              <div className="mt-6 flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: "1s",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : generatedImage ? (
            <>
              <img
                src={generatedImage}
                alt="Virtual try-on result"
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            </>
          ) : null}
        </div>

        {generatedImage && !isGenerating && (
          <div className="flex justify-center space-x-4">
            <Button variant="ai" onClick={onDownload} className="flex-1 max-w-xs">
              <Download className="h-4 w-4 mr-2" />
              Download Result
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneratedImageDisplay;