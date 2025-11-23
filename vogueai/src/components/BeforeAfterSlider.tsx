
import { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
}: BeforeAfterProps) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - left) / width) * 100;

    setPos(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden cursor-col-resize select-none"
      onMouseMove={(e) => handleMove(e.clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      <img
        src={afterImage}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div
        className="absolute inset-0 overflow-hidden border-r-2 border-white/50"
        style={{ width: `${pos}%` }}
      >
        <img
          src={beforeImage}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 flex items-center justify-center pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg -ml-0.5">
          <MoveHorizontal size={16} className="text-violet-600" />
        </div>
      </div>
    </div>
  );
}
