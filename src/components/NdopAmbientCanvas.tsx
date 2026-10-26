import React, { useEffect, useRef } from 'react';

/**
 * Canvas décoratif léger inspiré du tissage géométrique indigo.
 * - Strictement décoratif (aria-hidden="true", pointer-events-none)
 * - Se met en pause lorsque l'onglet est masqué ou hors écran (IntersectionObserver + visibilitychange)
 * - Respecte prefers-reduced-motion (rendu statique unique)
 * - Charge allégée sur mobile
 */
export const NdopAmbientCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrameId: number | null = null;
    let isVisible = true;
    let isTabActive = !document.hidden;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(0);
    };

    const drawDiamond = (cx: number, cy: number, radius: number, alpha: number, strokeStyle: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx + radius, cy);
      ctx.lineTo(cx, cy + radius);
      ctx.lineTo(cx - radius, cy);
      ctx.closePath();
      ctx.strokeStyle = strokeStyle;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const drawFrame = (t: number) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 768;
      const spacing = isMobile ? 96 : 120;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = c * spacing + (r % 2 === 0 ? 0 : spacing / 2);
          const cy = r * spacing;
          const wave = Math.sin(t * 0.0008 + (c + r) * 0.45);
          const alpha = 0.045 + (wave + 1) * 0.025;
          const radius = 14 + wave * 2.5;

          drawDiamond(cx, cy, radius, alpha, '#183153');
          drawDiamond(cx, cy, radius * 0.45, alpha * 0.8, '#B89158');
        }
      }
    };

    const loop = (timestamp: number) => {
      if (!isVisible || !isTabActive || prefersReducedMotion) {
        animationFrameId = null;
        return;
      }
      time = timestamp;
      drawFrame(time);
      animationFrameId = window.requestAnimationFrame(loop);
    };

    const startOrStop = () => {
      if (prefersReducedMotion) {
        drawFrame(0);
        return;
      }
      if (isVisible && isTabActive && animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(loop);
      } else if ((!isVisible || !isTabActive) && animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      startOrStop();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          startOrStop();
        });
      },
      { threshold: 0.05 }
    );

    resize();
    observer.observe(canvas);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    startOrStop();

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      observer.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    />
  );
};
