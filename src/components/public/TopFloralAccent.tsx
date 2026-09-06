import React from 'react';

export const TopFloralAccent = () => {
  return (
    <div className="w-full flex justify-center items-center py-6 overflow-hidden opacity-85 select-none pointer-events-none">
      <svg
        width="160"
        height="60"
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#1C1C1A] stroke-current"
      >
        {/* Central Stem & Flower */}
        <path d="M100 70 C 100 50, 100 35, 100 20" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="100" cy="18" r="4" fill="currentColor" />
        
        {/* Petals */}
        <path d="M100 18 C 95 10, 85 12, 92 22 C 95 20, 98 19, 100 18 Z" strokeWidth="1.2" fill="none" />
        <path d="M100 18 C 105 10, 115 12, 108 22 C 105 20, 102 19, 100 18 Z" strokeWidth="1.2" fill="none" />
        <path d="M100 18 C 90 22, 92 32, 100 26 C 100 23, 100 20, 100 18 Z" strokeWidth="1.2" fill="none" />
        <path d="M100 18 C 110 22, 108 32, 100 26 C 100 23, 100 20, 100 18 Z" strokeWidth="1.2" fill="none" />

        {/* Left Branch & Leaves */}
        <path d="M100 50 C 85 45, 70 38, 55 35" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M75 42 C 70 35, 62 38, 68 44 C 71 43, 73 43, 75 42 Z" strokeWidth="1" fill="none" />
        <path d="M60 37 C 52 32, 48 38, 54 41 C 57 39, 59 38, 60 37 Z" strokeWidth="1" fill="none" />

        {/* Right Branch & Leaves */}
        <path d="M100 50 C 115 45, 130 38, 145 35" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M125 42 C 130 35, 138 38, 132 44 C 129 43, 127 43, 125 42 Z" strokeWidth="1" fill="none" />
        <path d="M140 37 C 148 32, 152 38, 146 41 C 143 39, 141 38, 140 37 Z" strokeWidth="1" fill="none" />

        {/* Subtle Decorative Dots */}
        <circle cx="45" cy="34" r="1.5" fill="currentColor" />
        <circle cx="155" cy="34" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
};

export default TopFloralAccent;