
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import { Download } from "lucide-react";

export default function Gallery() {
  const items = [
    {
      id: 1,
      user: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&w=800",
      result:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&w=800",
      style: "Streetwear Vibe",
    },
    {
      id: 2,
      user: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&w=800",
      result:
        "https://images.unsplash.com/photo-1618932260643-be4bf999e9d7?auto=format&w=800",
      style: "Formal Suit",
    },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md"
        >
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-white font-bold">{item.style}</h3>
            <button className="text-slate-400 hover:text-white">
              <Download size={18} />
            </button>
          </div>

          <div className="p-2">
            <BeforeAfterSlider beforeImage={item.user} afterImage={item.result} />
          </div>
        </div>
      ))}
    </div>
  );
}
