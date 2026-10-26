import React from 'react';
import { motion } from 'motion/react';

export const NdopMotifFrieze: React.FC<{
  variant?: 'light' | 'dark' | 'bronze';
  className?: string;
}> = ({ variant = 'dark', className = '' }) => {
  const strokeColor =
    variant === 'light'
      ? '#FBF8F1'
      : variant === 'bronze'
      ? '#B89158'
      : '#183153';

  const accentColor = '#B89158';

  return (
    <div
      className={`w-full overflow-hidden select-none pointer-events-none flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-4xl h-7 md:h-9 opacity-85"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Lignes horizontales d'encadrement */}
        <motion.line
          x1="0"
          y1="4"
          x2="800"
          y2="4"
          stroke={strokeColor}
          strokeWidth="0.75"
          strokeOpacity="0.35"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <motion.line
          x1="0"
          y1="32"
          x2="800"
          y2="32"
          stroke={strokeColor}
          strokeWidth="0.75"
          strokeOpacity="0.35"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Frise géométrique répétée (chevrons, losanges concentriques, étoiles linéaires) */}
        <motion.path
          d="M 40 18 L 54 8 L 68 18 L 54 28 Z
             M 90 8 L 104 18 L 90 28 M 114 8 L 100 18 L 114 28
             M 140 18 L 154 8 L 168 18 L 154 28 Z
             M 190 18 H 230 M 210 8 V 28
             M 250 18 L 264 8 L 278 18 L 264 28 Z
             M 300 8 L 314 18 L 300 28 M 324 8 L 310 18 L 324 28
             M 350 18 L 364 8 L 378 18 L 364 28 Z
             M 422 18 L 436 8 L 450 18 L 436 28 Z
             M 476 8 L 490 18 L 476 28 M 500 8 L 486 18 L 500 28
             M 522 18 L 536 8 L 550 18 L 536 28 Z
             M 570 18 H 610 M 590 8 V 28
             M 632 18 L 646 8 L 660 18 L 646 28 Z
             M 686 8 L 700 18 L 686 28 M 710 8 L 696 18 L 710 28
             M 732 18 L 746 8 L 760 18 L 746 28 Z"
          stroke={strokeColor}
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.65"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Rosace centrale bronze */}
        <g transform="translate(400, 18)">
          <polygon
            points="0,-11 11,0 0,11 -11,0"
            stroke={accentColor}
            strokeWidth="1.4"
            fill="none"
          />
          <polygon
            points="0,-5 5,0 0,5 -5,0"
            fill={accentColor}
          />
        </g>

        {/* Points cardinaux sur les losanges */}
        {[54, 154, 264, 364, 436, 536, 646, 746].map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy={18}
            r="2"
            fill={accentColor}
            fillOpacity="0.85"
          />
        ))}
      </svg>
    </div>
  );
};

export const MonogramRJ: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'ivory';
}> = ({ size = 'md', variant = 'indigo' }) => {
  const dimensions =
    size === 'sm'
      ? 'w-10 h-10 text-base'
      : size === 'lg'
      ? 'w-24 h-24 text-3xl'
      : 'w-14 h-14 text-xl';

  const borderColor = variant === 'ivory' ? 'border-[#B89158]/60' : 'border-[#183153]/30';
  const textColor = variant === 'ivory' ? 'text-[#FBF8F1]' : 'text-[#183153]';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${dimensions} select-none`}
      aria-label="R & J"
    >
      {/* Cadre losange géométrique subtil */}
      <span
        className={`absolute inset-1 rotate-45 border ${borderColor} transition-transform duration-500`}
        aria-hidden="true"
      />
      <span
        className={`absolute inset-0 border ${borderColor}`}
        aria-hidden="true"
      />
      <span
        className={`relative font-serif font-semibold tracking-wider ${textColor}`}
      >
        R<span className="text-[#B89158] mx-0.5 font-normal italic">&amp;</span>J
      </span>
    </div>
  );
};
