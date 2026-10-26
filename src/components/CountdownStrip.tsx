import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

interface CountdownState {
  phase: 'upcoming-days-only' | 'upcoming-with-time' | 'today' | 'past';
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function computeWeddingCountdown(
  eventDateStr: string,
  eventStartTime: string | null
): CountdownState {
  const safeDateStr = /^\d{4}-\d{2}-\d{2}$/.test(eventDateStr) ? eventDateStr : '2026-12-01';
  const [year, month, day] = safeDateStr.split('-').map(Number);

  // Heure cible : si l'heure de début est précisée on l'utilise, sinon 00:00 (fuseau Africa/Douala UTC+01:00)
  const hasStartTime = Boolean(eventStartTime && /^\d{2}:\d{2}$/.test(eventStartTime.trim()));
  const [hh, mm] = hasStartTime ? eventStartTime!.trim().split(':').map(Number) : [0, 0];

  const isoTarget = `${safeDateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+01:00`;
  const targetMs = new Date(isoTarget).getTime();
  const endOfDayMs = new Date(`${safeDateStr}T23:59:59+01:00`).getTime();
  const nowMs = Date.now();

  if (Number.isNaN(targetMs)) {
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetLocal = new Date(year, month - 1, day).getTime();
    const fallbackDays = Math.max(0, Math.round((targetLocal - todayLocal) / 86400000));
    return {
      phase: 'upcoming-days-only',
      days: fallbackDays,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  if (nowMs >= targetMs && nowMs <= endOfDayMs) {
    return { phase: 'today', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  if (nowMs > endOfDayMs) {
    return { phase: 'past', days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const remainingSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const days = Math.floor(remainingSec / 86400);
  const hours = Math.floor((remainingSec % 86400) / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const seconds = remainingSec % 60;

  return {
    phase: hasStartTime ? 'upcoming-with-time' : 'upcoming-days-only',
    days,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Compte à rebours élégant intégré en haut de la page d'accueil (Hero)
 * avec apparition fluide via Framer Motion.
 */
export const HeroCountdownBadge: React.FC = () => {
  const { settings, t, locale } = useWedding();
  const [state, setState] = useState<CountdownState>(() =>
    computeWeddingCountdown(settings.eventDate, settings.eventStartTime)
  );

  useEffect(() => {
    setState(computeWeddingCountdown(settings.eventDate, settings.eventStartTime));
    const interval = window.setInterval(() => {
      setState(computeWeddingCountdown(settings.eventDate, settings.eventStartTime));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [settings.eventDate, settings.eventStartTime]);

  const boxes = [
    { value: state.days, label: state.days === 1 ? t.countdown.singularDay : t.countdown.daysLabel },
    { value: state.hours, label: t.countdown.hoursLabel },
    { value: state.minutes, label: t.countdown.minutesLabel },
    { value: state.seconds, label: t.countdown.secondsLabel },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, delay: 0.58, ease: [0.16, 1, 0.3, 1] }}
      className="my-7 max-w-2xl mx-auto"
    >
      {state.phase === 'today' ? (
        <div className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#101D35]/85 border border-[#B89158]/60 text-white text-sm sm:text-base font-medium">
          <Calendar className="w-4 h-4 text-[#B89158]" />
          <span>{t.countdown.todayMessage}</span>
        </div>
      ) : state.phase === 'past' ? (
        <div className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#101D35]/85 border border-[#B89158]/60 text-white text-sm sm:text-base font-medium">
          <Calendar className="w-4 h-4 text-[#B89158]" />
          <span>{t.countdown.pastMessage}</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg mx-auto">
            {boxes.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.62 + idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#101D35]/80 border border-[#B89158]/50 px-2.5 py-3 sm:py-4 text-center backdrop-blur-[2px]"
              >
                <span className="block text-xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="block text-[10px] sm:text-xs uppercase tracking-widest text-[#B89158] mt-1">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
          <p className="text-[11px] sm:text-xs text-[#E8EEF6]/90 tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
            {state.phase === 'upcoming-days-only'
              ? `${state.days} ${state.days === 1 ? t.countdown.singularDay : t.countdown.daysLabel} ${t.countdown.beforeBigDay} · ${
                  locale === 'fr' ? 'Horaire exact à confirmer' : 'Exact time to be confirmed'
                }`
              : `${t.countdown.beforeBigDay} (${settings.timeZone})`}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export const CountdownStrip: React.FC = () => {
  const { settings, t } = useWedding();
  const [state, setState] = useState<CountdownState>(() =>
    computeWeddingCountdown(settings.eventDate, settings.eventStartTime)
  );

  useEffect(() => {
    setState(computeWeddingCountdown(settings.eventDate, settings.eventStartTime));
    const interval = window.setInterval(() => {
      setState(computeWeddingCountdown(settings.eventDate, settings.eventStartTime));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [settings.eventDate, settings.eventStartTime]);

  return (
    <div className="w-full border-y border-[#183153]/15 bg-white py-6 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-[#19263B]/80">
          <Clock className="w-4 h-4 text-[#B89158] shrink-0" />
          <span className="font-semibold text-[#183153]">{t.hero.dateDisplay}</span>
          <span aria-hidden="true">·</span>
          <span>{t.hero.locationDisplay}</span>
        </div>

        {state.phase === 'upcoming-days-only' && (
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#183153] tabular-nums">
              {state.days}
            </span>
            <span className="text-sm text-[#19263B]/85 font-medium">
              {state.days === 1 ? t.countdown.singularDay : t.countdown.daysLabel}{' '}
              {t.countdown.beforeBigDay}
            </span>
          </div>
        )}

        {state.phase === 'upcoming-with-time' && (
          <div className="flex items-center gap-4 sm:gap-6 tabular-nums">
            <div className="text-center">
              <span className="block text-xl sm:text-2xl font-bold text-[#183153]">
                {String(state.days).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-[#19263B]/70">{t.countdown.daysLabel}</span>
            </div>
            <span className="text-[#B89158]">·</span>
            <div className="text-center">
              <span className="block text-xl sm:text-2xl font-bold text-[#183153]">
                {String(state.hours).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-[#19263B]/70">{t.countdown.hoursLabel}</span>
            </div>
            <span className="text-[#B89158]">·</span>
            <div className="text-center">
              <span className="block text-xl sm:text-2xl font-bold text-[#183153]">
                {String(state.minutes).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-[#19263B]/70">{t.countdown.minutesLabel}</span>
            </div>
            <span className="text-[#B89158]">·</span>
            <div className="text-center">
              <span className="block text-xl sm:text-2xl font-bold text-[#183153]">
                {String(state.seconds).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-[#19263B]/70">{t.countdown.secondsLabel}</span>
            </div>
          </div>
        )}

        {state.phase === 'today' && (
          <p className="italic text-lg sm:text-xl font-medium text-[#183153]">
            {t.countdown.todayMessage}
          </p>
        )}

        {state.phase === 'past' && (
          <p className="italic text-lg sm:text-xl font-medium text-[#183153]">
            {t.countdown.pastMessage}
          </p>
        )}
      </div>
    </div>
  );
};
