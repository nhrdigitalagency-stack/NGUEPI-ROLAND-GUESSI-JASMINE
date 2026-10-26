import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Camera, X, ChevronLeft, ChevronRight, Lock, RefreshCw } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { NdopMotifFrieze } from '../components/NdopMotif';

export const GalleryPage: React.FC = () => {
  const { t, settings, photos, albumLocked, loading, error, unlockAlbum, refreshData } = useWedding();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const isAfterEvent = new Date() > new Date(`${settings.eventDate}T23:59:59+01:00`);

  // Désactiver l'indexation de l'album privé par les moteurs de recherche
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const showPrev = useCallback(() => {
    if (lightboxIndex === null || photos.length === 0) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }, [lightboxIndex, photos.length]);

  const showNext = useCallback(() => {
    if (lightboxIndex === null || photos.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }, [lightboxIndex, photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(false);
    setUnlocking(true);
    const ok = await unlockAlbum(code);
    setUnlocking(false);
    if (!ok) {
      setCodeError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de la page Souvenirs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-2">
              {t.gallery.kicker}
            </p>
            <h1
              className="font-serif text-3xl sm:text-5xl text-[#101D35] font-normal mb-4"
              style={{ textWrap: 'balance' }}
            >
              {isAfterEvent ? t.gallery.titleAfter : t.gallery.titleBefore}
            </h1>
            <p className="text-base text-[#19263B]/80 leading-relaxed">
              {t.gallery.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/partager-des-photos"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#183153] text-[#FBF8F1] text-xs sm:text-sm font-medium hover:bg-[#101D35] transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>{t.gallery.shareBtn}</span>
            </Link>
          </div>
        </div>

        <NdopMotifFrieze variant="dark" className="mb-12" />

        {/* État verrouillé par code invité (si activé par l'organisation) */}
        {albumLocked ? (
          <div className="max-w-md mx-auto bg-white border border-[#183153]/20 p-8 sm:p-10 text-center my-12">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-[#183153] text-[#FBF8F1]">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-2xl text-[#101D35] mb-2">
              {t.gallery.lockedTitle}
            </h2>
            <p className="text-sm text-[#19263B]/80 mb-6 leading-relaxed">
              {t.gallery.lockedSubtitle}
            </p>
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError(false);
                }}
                placeholder={t.gallery.accessCodePlaceholder}
                className="w-full px-4 py-3 border border-[#183153]/30 text-center text-sm focus:outline-none focus:border-[#183153]"
              />
              {codeError && (
                <p className="text-xs text-red-700" role="alert">
                  {t.gallery.invalidCode}
                </p>
              )}
              <button
                type="submit"
                disabled={unlocking}
                className="w-full py-3 bg-[#183153] text-[#FBF8F1] text-xs font-medium uppercase tracking-wider hover:bg-[#101D35] transition-colors cursor-pointer"
              >
                {t.gallery.unlockBtn}
              </button>
            </form>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-sm text-[#19263B]/75">
            {t.gallery.loadingState}
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-sm text-red-800">{t.gallery.errorState}</p>
            <button
              type="button"
              onClick={refreshData}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#183153]/30 text-xs font-medium text-[#183153]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#183153]/15 p-10">
            <p className="font-serif text-2xl text-[#101D35] mb-3">
              {t.gallery.emptyState}
            </p>
            <Link
              to="/partager-des-photos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#183153] text-[#FBF8F1] text-xs font-medium mt-2"
            >
              <Camera className="w-4 h-4" />
              <span>{t.gallery.shareBtn}</span>
            </Link>
          </div>
        ) : (
          /* Grille raffinée des photos approuvées */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {photos.map((photo, index) => (
              <div
                key={photo._id}
                className="group bg-white border border-[#183153]/15 p-3 flex flex-col justify-between transition-colors hover:border-[#183153]/40"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="block w-full text-left overflow-hidden bg-[#101D35] aspect-[4/5] relative cursor-pointer focus-visible:outline-2 focus-visible:outline-[#183153]"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `${settings.groomName} & ${settings.brideName}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </button>

                <div className="pt-3.5 px-1 space-y-1">
                  {photo.caption && (
                    <p className="text-sm text-[#19263B] leading-snug">
                      {photo.caption}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#315783]">
                    {photo.isOfficial ? (
                      <span>{t.gallery.officialBadge}</span>
                    ) : photo.showAuthorName && photo.authorName ? (
                      <span>
                        {t.gallery.guestBy} {photo.authorName}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Plein Écran avec navigation clavier et fermeture Échap */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visionneuse photo"
          className="fixed inset-0 z-50 bg-[#101D35]/95 flex flex-col justify-between p-4 sm:p-8"
        >
          <div className="flex items-center justify-between text-[#FBF8F1]">
            <span className="font-mono text-xs text-[#E8EEF6]/80 tabular-nums">
              {lightboxIndex + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={closeLightbox}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#FBF8F1]/25 text-xs text-[#FBF8F1] hover:bg-[#FBF8F1]/10 transition-colors cursor-pointer"
            >
              <span>{t.gallery.closeLightbox}</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <button
              type="button"
              onClick={showPrev}
              aria-label={t.gallery.prevPhoto}
              className="absolute left-2 sm:left-6 z-10 w-11 h-11 flex items-center justify-center bg-[#183153]/80 border border-[#FBF8F1]/25 text-[#FBF8F1] hover:bg-[#B89158] hover:text-[#101D35] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption || `${settings.groomName} & ${settings.brideName}`}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] max-w-full object-contain border border-[#FBF8F1]/15"
            />

            <button
              type="button"
              onClick={showNext}
              aria-label={t.gallery.nextPhoto}
              className="absolute right-2 sm:right-6 z-10 w-11 h-11 flex items-center justify-center bg-[#183153]/80 border border-[#FBF8F1]/25 text-[#FBF8F1] hover:bg-[#B89158] hover:text-[#101D35] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center max-w-2xl mx-auto text-[#FBF8F1] space-y-1">
            {photos[lightboxIndex].caption && (
              <p className="font-serif text-lg sm:text-xl text-[#FBF8F1]">
                {photos[lightboxIndex].caption}
              </p>
            )}
            <p className="text-xs text-[#B89158]">
              {photos[lightboxIndex].isOfficial
                ? t.gallery.officialBadge
                : photos[lightboxIndex].showAuthorName && photos[lightboxIndex].authorName
                ? `${t.gallery.guestBy} ${photos[lightboxIndex].authorName}`
                : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
