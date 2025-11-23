import { useState } from "react";
import { LayoutGrid, User, Shirt, Sparkles, Loader2, Wand2 } from "lucide-react";
import DropZone from "../components/DropZone";
import BeforeAfterSlider from "../components/BeforeAfterSlider";

export default function Studio() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateUpload = (type: "user" | "outfit") => {
    if (type === "user") {
      setUserImage(
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&w=800"
      );
    } else {
      setOutfitImage(
        "https://images.unsplash.com/photo-1550614000-4b9519e02d86?auto=format&w=800"
      );
    }
  };

  const handleGenerate = () => {
    if (!userImage || !outfitImage) return;

    setIsGenerating(true);
    setProgress(0);
    setGenerated(null);

    const interval = setInterval(
      () => setProgress((p) => (p >= 100 ? 100 : p + 2)),
      50
    );

    setTimeout(() => {
      clearInterval(interval);
      setGenerated(
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&w=800"
      );
      setIsGenerating(false);
    }, 2500);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 h-full animate-in fade-in duration-500">
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
                preview={userImage}
                onUpload={() => simulateUpload("user")}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase font-bold">Outfit</label>
              <DropZone
                icon={Shirt}
                label="Upload Outfit"
                active={!!outfitImage}
                preview={outfitImage}
                onUpload={() => simulateUpload("outfit")}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!userImage || !outfitImage || isGenerating}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
            !userImage || !outfitImage
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white"
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Wand2 /> Generate Fit
            </>
          )}
        </button>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-2 relative flex items-center justify-center bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
        {!generated && !isGenerating && (
          <div className="text-center p-8">
            <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles size={36} className="text-violet-400" />
            </div>
            <h3 className="text-xl text-white font-medium">Ready to Create</h3>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-xs font-mono text-violet-300">
                <span>PROCESSING</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full">
                <div
                  className="h-full bg-violet-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {generated && !isGenerating && (
          <div className="absolute inset-0 p-6">
            <div className="rounded-2xl overflow-hidden shadow-2xl h-full">
              <BeforeAfterSlider
                beforeImage={userImage!}
                afterImage={generated}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

