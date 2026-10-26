import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { officialGalleryShowcase } from '../config/weddingConfig';

export const UnionPhotoCarousel: React.FC = () => {
  const { locale, settings } = useWedding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slides = officialGalleryShowcase;
  const total = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isPaused || total <= 1) return;

    const timer = window.setInterval(() => {
      nextSlide();
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isPaused, nextSlide, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlide = slides[currentIndex];
  const currentCaption = locale === 'fr' ? currentSlide.altFr : currentSlide.altEn;

  return (
    <div
      className="relative border border-[#183153]/20 bg-white p-3 sm:p-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${settings.groomName} & ${settings.brideName}`}
    >
      {/* Cadre image avec transition de fondu enchaîné (fade) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#101D35]">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentSlide.id}
            src={currentSlide.src}
            alt={currentCaption}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        </AnimatePresence>

        {/* Dégradé inférieur subtil pour la légende et les contrôles */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Boutons Précédent / Suivant accessibles */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label={locale === 'fr' ? 'Photo précédente' : 'Previous photo'}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-[#101D35]/70 text-[#FBF8F1] border border-white/25 hover:bg-[#B89158] hover:text-[#101D35] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label={locale === 'fr' ? 'Photo suivante' : 'Next photo'}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-[#101D35]/70 text-[#FBF8F1] border border-white/25 hover:bg-[#B89158] hover:text-[#101D35] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bouton Pause / Lecture discret en haut à droite */}
        <button
          type="button"
          onClick={() => setIsPaused((p) => !p)}
          aria-label={
            isPaused
              ? locale === 'fr'
                ? 'Reprendre le défilement automatique'
                : 'Resume autoplay'
              : locale === 'fr'
              ? 'Mettre en pause le défilement automatique'
              : 'Pause autoplay'
          }
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/45 text-white/90 border border-white/20 hover:bg-black/70 transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Légende et indicateurs en bas de l'image */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 flex flex-col gap-3">
          <p className="text-xs sm:text-sm text-[#FBF8F1] font-medium leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            {currentCaption}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {slides.map((slide, idx) => {
                const active = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`${locale === 'fr' ? 'Aller à la photo' : 'Go to photo'} ${idx + 1}`}
                    aria-current={active ? 'true' : undefined}
                    className={`h-1.5 transition-all duration-300 cursor-pointer ${
                      active ? 'w-7 bg-[#B89158]' : 'w-2.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                );
              })}
            </div>

            <span className="text-[11px] font-medium text-white/85 tabular-nums">
              {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
