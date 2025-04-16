import { useState, useEffect } from "react";
import type { Flashcard as FlashcardType } from "@shared/schema";

interface FlashcardProps {
  flashcard: FlashcardType;
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
}

export default function Flashcard({ flashcard, isFlipped = false, onFlip, className = "" }: FlashcardProps) {
  const [localIsFlipped, setLocalIsFlipped] = useState(isFlipped);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalIsFlipped(isFlipped);
  }, [isFlipped]);
  
  const handleClick = () => {
    if (onFlip) {
      onFlip();
    } else {
      setLocalIsFlipped(!localIsFlipped);
    }
  };
  
  const flippedState = onFlip !== undefined ? isFlipped : localIsFlipped;
  
  return (
    <div 
      className={`relative perspective-1000 ${className}`} 
      onClick={handleClick}
    >
      <div className="relative w-full h-full">
        {/* Front side - shown when not flipped */}
        <div 
          className={`absolute inset-0 transition-all duration-300 ease-in-out bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center shadow-sm ${
            flippedState ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <span className="text-lg text-center">{flashcard.front}</span>
        </div>
        
        {/* Back side - shown when flipped */}
        <div 
          className={`absolute inset-0 transition-all duration-300 ease-in-out bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center shadow-sm ${
            flippedState ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <span className="text-md text-center">{flashcard.back}</span>
        </div>
      </div>
    </div>
  );
}

// Tailwind doesn't generate these classes by default, add CSS
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    .perspective-1000 {
      perspective: 1000px;
    }
    .preserve-3d {
      transform-style: preserve-3d;
    }
    .backface-hidden {
      backface-visibility: hidden;
    }
    .rotate-y-180 {
      transform: rotateY(180deg);
    }
  `;
  document.head.appendChild(style);
}
