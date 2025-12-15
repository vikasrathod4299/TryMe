import { useRef, useState } from "react";

const TiltCard = ({ children } : { children: React.ReactNode }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation based on mouse position relative to center
    // Limit rotation to +/- 10 degrees
    const rotateX = ((y - centerY) / centerY) * -8; 
    const rotateY = ((x - centerX) / centerX) * 8;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={(e) => { setIsHovering(true); handleMouseMove(e); }}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${isHovering ? rotation.x : 0}deg) rotateY(${isHovering ? rotation.y : 0}deg) scale3d(${isHovering ? 1.02 : 1}, ${isHovering ? 1.02 : 1}, 1)`,
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-in-out'
      }}
      className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl cursor-pointer"
    >
      {children}

      {/* Dynamic Shine Effect */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovering ? 0.25 : 0,
          background: `radial-gradient(circle at ${50 + (rotation.y * 3)}% ${50 + (rotation.x * -3)}%, rgba(255,255,255,0.8), transparent 60%)`
        }}
      />
    </div>
  );
};

export default TiltCard;
