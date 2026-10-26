import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CentralWeddingConfig, defaultWeddingConfig } from '../config/weddingConfig';
import frTranslations from '../locales/fr.json';
import enTranslations from '../locales/en.json';

export type Locale = 'fr' | 'en';

export interface AnnouncementPublic {
  _id: string;
  titleFr: string;
  titleEn: string;
  contentFr: string;
  contentEn: string;
  category: 'access' | 'schedule' | 'organization' | 'info';
  active: boolean;
  createdAt: string;
}

export interface GalleryPhotoPublic {
  _id: string;
  url: string;
  authorName: string;
  showAuthorName: boolean;
  caption: string;
  isOfficial: boolean;
  createdAt: string;
}

interface WeddingContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: typeof frTranslations;
  settings: CentralWeddingConfig;
  announcements: AnnouncementPublic[];
  photos: GalleryPhotoPublic[];
  albumLocked: boolean;
  sanityConnected: boolean;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  unlockAlbum: (code: string) => Promise<boolean>;
}

const WeddingContext = createContext<WeddingContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'rj_wedding_locale';
const ALBUM_TOKEN_KEY = 'rj_guest_album_token';

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === 'en' || saved === 'fr') return saved;
    } catch {}
    return defaultWeddingConfig.defaultLocale;
  });

  const [settings, setSettings] = useState<CentralWeddingConfig>(defaultWeddingConfig);
  const [announcements, setAnnouncements] = useState<AnnouncementPublic[]>([]);
  const [photos, setPhotos] = useState<GalleryPhotoPublic[]>([]);
  const [albumLocked, setAlbumLocked] = useState<boolean>(false);
  const [sanityConnected, setSanityConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, loc);
    } catch {}
    document.documentElement.lang = loc;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    const dict = locale === 'fr' ? frTranslations : enTranslations;
    document.title = dict.meta.title;
  }, [locale]);

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const guestToken = sessionStorage.getItem(ALBUM_TOKEN_KEY) || localStorage.getItem('rj_admin_token');
      const headers: Record<string, string> = {};
      if (guestToken) {
        headers['Authorization'] = `Bearer ${guestToken}`;
      }

      const res = await fetch('/api/bootstrap', { headers });
      if (!res.ok) throw new Error('Bootstrap error');
      const data = await res.json();

      if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
      if (Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
      if (Array.isArray(data.photos)) {
        setPhotos(data.photos);
      }
      setAlbumLocked(Boolean(data.albumLocked));
      setSanityConnected(Boolean(data.sanityConnected));
    } catch (err) {
      setError('Backend connection error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const unlockAlbum = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/album/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem(ALBUM_TOKEN_KEY, data.token);
          await refreshData();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [refreshData]
  );

  const t = locale === 'fr' ? frTranslations : enTranslations;

  return (
    <WeddingContext.Provider
      value={{
        locale,
        setLocale,
        t,
        settings,
        announcements,
        photos,
        albumLocked,
        sanityConnected,
        loading,
        error,
        refreshData,
        unlockAlbum,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export function useWedding() {
  const ctx = useContext(WeddingContext);
  if (!ctx) {
    throw new Error('useWedding must be used inside WeddingProvider');
  }
  return ctx;
}
