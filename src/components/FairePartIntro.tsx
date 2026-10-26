import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWedding } from '../context/WeddingContext';
import { MonogramRJ, NdopMotifFrieze } from './NdopMotif';

const INTRO_SEEN_KEY = 'rj_faire_part_opened_v1';

export const FairePartIntro: React.FC = () => {
  const { t, settings } = useWedding();
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    try {
      const seen = sessionStorage.getItem(INTRO_SEEN_KEY);
      if (!seen) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, 'true');
    } catch {}
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      dismiss();
    }, 5200);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-label={t.intro.kicker}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#101D35] text-[#FBF8F1] px-4 py-8 overflow-hidden"
        >
          {/* Cadre architectural de faire-part */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.03, opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl border border-[#B89158]/40 bg-[#183153]/90 p-8 sm:p-12 text-center shadow-2xl"
          >
            <div className="mb-6 flex justify-center">
              <MonogramRJ size="lg" variant="ivory" />
            </div>

            <p className="text-xs uppercase tracking-[0.25em] text-[#B89158] mb-3">
              {t.intro.kicker}
            </p>

            <h2
              className="font-serif text-3xl sm:text-5xl font-normal tracking-wide text-[#FBF8F1] mb-3"
              style={{ textWrap: 'balance' }}
            >
              {settings.groomName} <span className="italic text-[#B89158]">&amp;</span> {settings.brideName}
            </h2>

            <p className="text-sm text-[#E8EEF6]/85 mb-6">
              {t.intro.subtitle} · {t.hero.dateDisplay} · {settings.city}
            </p>

            <NdopMotifFrieze variant="light" className="my-6" />

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={dismiss}
                className="w-full sm:w-auto px-7 py-3 bg-[#B89158] text-[#101D35] font-medium text-sm tracking-wide hover:bg-[#c9a369] transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.intro.openButton}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-[#E8EEF6]/75 hover:text-[#FBF8F1] underline underline-offset-4 py-2 px-3 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.intro.skipButton}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
