import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Lock,
  LogOut,
  Check,
  X,
  Trash2,
  Plus,
  Save,
  Upload,
  QrCode,
  Bell,
  Image as ImageIcon,
  Settings,
  Database,
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { CentralWeddingConfig } from '../config/weddingConfig';
import { processAndStripExifImage } from '../utils/imageProcessor';

interface AdminPhoto {
  _id: string;
  url: string;
  authorName: string;
  showAuthorName: boolean;
  caption: string;
  status: 'pending' | 'approved' | 'rejected';
  isOfficial: boolean;
  createdAt: string;
}

interface AdminAnnouncement {
  _id: string;
  titleFr: string;
  titleEn: string;
  contentFr: string;
  contentEn: string;
  category: 'access' | 'schedule' | 'organization' | 'info';
  active: boolean;
  createdAt: string;
}

const ADMIN_TOKEN_KEY = 'rj_admin_token';

export const AdminPage: React.FC = () => {
  const { t, locale, refreshData } = useWedding();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY));

  // Formulaire de connexion
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<'settings' | 'photos' | 'announcements' | 'qrcode'>('settings');

  // Données d'administration
  const [formSettings, setFormSettings] = useState<CentralWeddingConfig & { albumAccessCode?: string } | null>(null);
  const [parentsInput, setParentsInput] = useState('');
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [sanityInfo, setSanityInfo] = useState<{
    projectId: string;
    organizationId: string;
    dataset: string;
    connected: boolean;
  } | null>(null);

  // États d'actions
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingCaptions, setEditingCaptions] = useState<Record<string, string>>({});
  const [uploadingOfficial, setUploadingOfficial] = useState(false);

  // Nouvelle annonce
  const [annTitleFr, setAnnTitleFr] = useState('');
  const [annTitleEn, setAnnTitleEn] = useState('');
  const [annContentFr, setAnnContentFr] = useState('');
  const [annContentEn, setAnnContentEn] = useState('');
  const [annCategory, setAnnCategory] = useState<'access' | 'schedule' | 'organization' | 'info'>('info');

  const fetchAdminDashboard = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (data.settings) {
        setFormSettings(data.settings);
        setParentsInput(Array.isArray(data.settings.parentsNames) ? data.settings.parentsNames.join(', ') : '');
      }
      if (Array.isArray(data.photos)) {
        setPhotos(data.photos);
        const capMap: Record<string, string> = {};
        data.photos.forEach((p: AdminPhoto) => {
          capMap[p._id] = p.caption || '';
        });
        setEditingCaptions(capMap);
      }
      if (Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
      if (data.sanityInfo) {
        setSanityInfo({
          ...data.sanityInfo,
          connected: Boolean(data.sanityConnected),
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (token) {
      fetchAdminDashboard(token);
    }
  }, [token, fetchAdminDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setLoginError(t.admin.loginError);
        setLoggingIn(false);
        return;
      }
      const data = await res.json();
      if (data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setToken(data.token);
      }
    } catch {
      setLoginError(t.admin.loginError);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setUsername('');
    setPassword('');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formSettings) return;
    setSavingSettings(true);
    setSaveMessage('');

    const parsedParents = parentsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formSettings,
          parentsNames: parsedParents,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveMessage(
          data.sanityUpdated
            ? locale === 'fr'
              ? 'Modifications enregistrées et synchronisées sur Sanity CMS.'
              : 'Changes saved and synchronized with Sanity CMS.'
            : locale === 'fr'
            ? 'Modifications enregistrées.'
            : 'Changes saved.'
        );
        await refreshData();
        setTimeout(() => setSaveMessage(''), 4000);
      }
    } catch {} finally {
      setSavingSettings(false);
    }
  };

  const handleModeratePhoto = async (photoId: string, updates: { status?: string; caption?: string }) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchAdminDashboard(token);
        await refreshData();
      }
    } catch {}
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p._id !== photoId));
        await refreshData();
      }
    } catch {}
  };

  const handleUploadOfficialPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files || e.target.files.length === 0) return;
    setUploadingOfficial(true);
    const file = e.target.files[0];
    try {
      const cleanFile = await processAndStripExifImage(file);
      const formData = new FormData();
      formData.append('photo', cleanFile);
      formData.append('authorName', 'Collection Officielle');
      formData.append('caption', '');
      formData.append('showAuthorName', 'true');
      formData.append('consent', 'true');
      formData.append('isOfficial', 'true');

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        await fetchAdminDashboard(token);
        await refreshData();
      }
    } catch {} finally {
      setUploadingOfficial(false);
      e.target.value = '';
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !annTitleFr.trim() || !annContentFr.trim()) return;
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titleFr: annTitleFr,
          titleEn: annTitleEn || annTitleFr,
          contentFr: annContentFr,
          contentEn: annContentEn || annContentFr,
          category: annCategory,
        }),
      });
      if (res.ok) {
        setAnnTitleFr('');
        setAnnTitleEn('');
        setAnnContentFr('');
        setAnnContentEn('');
        await fetchAdminDashboard(token);
        await refreshData();
      }
    } catch {}
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a._id !== id));
        await refreshData();
      }
    } catch {}
  };

  // =========================================================================
  // ÉCRAN DE CONNEXION (/admin)
  // =========================================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white border border-[#183153]/20 p-8 sm:p-10">
          <div className="w-12 h-12 bg-[#183153] text-[#FBF8F1] flex items-center justify-center mb-6">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-3xl text-[#101D35] mb-2">
            {t.admin.loginTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#19263B]/75 mb-6 leading-relaxed">
            {t.admin.loginSubtitle}
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5"
              >
                {t.admin.usernameLabel}
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="roland-jasmine"
                className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/40 text-sm focus:outline-none focus:border-[#183153]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5"
              >
                {t.admin.passwordLabel}
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/40 text-sm focus:outline-none focus:border-[#183153]"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-700" role="alert">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 bg-[#183153] text-[#FBF8F1] text-xs font-semibold uppercase tracking-wider hover:bg-[#101D35] transition-colors cursor-pointer"
            >
              {t.admin.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TABLEAU DE BORD PROPRIÉTAIRES / ORGANISATEURS (Connecté à Sanity CMS)
  // =========================================================================
  const pendingCount = photos.filter((p) => p.status === 'pending').length;
  const filteredPhotos = photos.filter((p) => (photoFilter === 'all' ? true : p.status === photoFilter));
  const contributionUrl = `${window.location.origin}/partager-des-photos`;

  return (
    <div className="min-h-screen bg-[#FBF8F1] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Barre supérieure d'administration */}
        <div className="bg-[#101D35] text-[#FBF8F1] p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#B89158]/30">
          <div>
            <div className="flex items-center gap-3 text-xs text-[#B89158] mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>
                Sanity CMS · Projet : {sanityInfo?.projectId || 'waphlwvv'} · Dataset :{' '}
                {sanityInfo?.dataset || 'production'}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#FBF8F1]">
              {t.admin.loginTitle}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#FBF8F1]/25 text-xs text-[#FBF8F1] hover:bg-[#FBF8F1]/10 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.admin.logoutBtn}</span>
          </button>
        </div>

        {/* Navigation par onglets */}
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#183153]/15 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#183153] text-[#FBF8F1]'
                : 'bg-white text-[#19263B] border border-[#183153]/20 hover:bg-[#E8EEF6]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.admin.tabs.settings}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-[#183153] text-[#FBF8F1]'
                : 'bg-white text-[#19263B] border border-[#183153]/20 hover:bg-[#E8EEF6]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>
              {t.admin.tabs.photos} ({pendingCount} en attente)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-[#183153] text-[#FBF8F1]'
                : 'bg-white text-[#19263B] border border-[#183153]/20 hover:bg-[#E8EEF6]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{t.admin.tabs.announcements}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-[#183153] text-[#FBF8F1]'
                : 'bg-white text-[#19263B] border border-[#183153]/20 hover:bg-[#E8EEF6]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t.admin.tabs.qrcode}</span>
          </button>
        </div>

        {/* ===================================================================
            ONGLET 1 : MODIFICATION DES INFORMATIONS DU SITE (SANITY CMS)
        =================================================================== */}
        {activeTab === 'settings' && formSettings && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white border border-[#183153]/15 p-6 sm:p-10 space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#183153]/15 pb-5">
              <div>
                <h2 className="font-serif text-2xl text-[#101D35]">
                  Modifier les informations de la cérémonie
                </h2>
                <p className="text-xs text-[#19263B]/70">
                  Toutes les modifications sont immédiatement publiées sur le site et enregistrées dans Sanity CMS.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#183153] text-[#FBF8F1] text-xs font-semibold uppercase tracking-wider hover:bg-[#101D35] transition-colors cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
              </button>
            </div>

            {saveMessage && (
              <div className="p-4 bg-[#183153] text-[#FBF8F1] text-xs sm:text-sm flex items-center gap-2">
                <Check className="w-4 h-4 text-[#B89158]" />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* 1. Horaires, Date et Lieu exact à Bangangté */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Date de l’événement
                </label>
                <input
                  type="date"
                  value={formSettings.eventDate}
                  onChange={(e) => setFormSettings({ ...formSettings, eventDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Heure de début (laisser vide si non connue)
                </label>
                <input
                  type="time"
                  value={formSettings.eventStartTime || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, eventStartTime: e.target.value || null })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Heure de fin (facultatif)
                </label>
                <input
                  type="time"
                  value={formSettings.eventEndTime || ''}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, eventEndTime: e.target.value || null })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Nom précis du village de la mariée (Bangangté)
                </label>
                <input
                  type="text"
                  value={formSettings.villageName}
                  onChange={(e) => setFormSettings({ ...formSettings, villageName: e.target.value })}
                  placeholder="À renseigner dès confirmation..."
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Lieu / Concession familiale
                </label>
                <input
                  type="text"
                  value={formSettings.venueName}
                  onChange={(e) => setFormSettings({ ...formSettings, venueName: e.target.value })}
                  placeholder="Ex. : Domicile familial..."
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Adresse & repères d’arrivée
                </label>
                <input
                  type="text"
                  value={formSettings.address}
                  onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                  placeholder="Repères précis dans le village..."
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Lien GPS exact Google Maps (active le bouton Itinéraire)
                </label>
                <input
                  type="url"
                  value={formSettings.mapsUrl}
                  onChange={(e) => setFormSettings({ ...formSettings, mapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Indications routières détaillées
                </label>
                <textarea
                  rows={2}
                  value={formSettings.directions}
                  onChange={(e) => setFormSettings({ ...formSettings, directions: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Tenue conseillée / Dress code (masqué si vide)
                </label>
                <textarea
                  rows={2}
                  value={formSettings.dressCode}
                  onChange={(e) => setFormSettings({ ...formSettings, dressCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Informations de stationnement (facultatif)
                </label>
                <input
                  type="text"
                  value={formSettings.parkingInfo}
                  onChange={(e) => setFormSettings({ ...formSettings, parkingInfo: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                  Suggestions d’hébergement à Bangangté (facultatif)
                </label>
                <input
                  type="text"
                  value={formSettings.accommodationInfo}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, accommodationInfo: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                />
              </div>
            </div>

            {/* 2. Familles, Mot du couple et Étape 4 */}
            <div className="pt-6 border-t border-[#183153]/15 space-y-5">
              <h3 className="font-serif text-xl text-[#101D35]">
                Familles, Mot du couple &amp; Contact WhatsApp
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                    Noms des parents (séparés par une virgule, masqué si vide)
                  </label>
                  <input
                    type="text"
                    value={parentsInput}
                    onChange={(e) => setParentsInput(e.target.value)}
                    placeholder="Famille Nguepi, Famille Guessi..."
                    className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                    Contact WhatsApp de l’organisation (affiché)
                  </label>
                  <input
                    type="text"
                    value={formSettings.whatsappDisplayNumber}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        whatsappDisplayNumber: e.target.value,
                        whatsappNumber: e.target.value.replace(/[^\d]/g, ''),
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                    Mot du couple (Français — masqué si vide)
                  </label>
                  <textarea
                    rows={2}
                    value={formSettings.coupleWordFr}
                    onChange={(e) => setFormSettings({ ...formSettings, coupleWordFr: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1.5">
                    Précision symbolique Étape 4 (facultatif)
                  </label>
                  <textarea
                    rows={2}
                    value={formSettings.symbolicSharingNoteFr}
                    onChange={(e) =>
                      setFormSettings({ ...formSettings, symbolicSharingNoteFr: e.target.value })
                    }
                    placeholder="Si les familles souhaitent mentionner un partage symbolique..."
                    className="w-full px-3.5 py-2.5 border border-[#183153]/25 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 3. Contrôle de l'album participatif */}
            <div className="pt-6 border-t border-[#183153]/15 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.contributionsOpen}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, contributionsOpen: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 accent-[#183153]"
                />
                <span className="text-xs sm:text-sm text-[#19263B]">
                  <strong>Ouvrir le dépôt de photos</strong> par les invités
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.albumPrivate}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, albumPrivate: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 accent-[#183153]"
                />
                <span className="text-xs sm:text-sm text-[#19263B]">
                  <strong>Demander un code d’accès invité</strong> pour consulter l’album
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1">
                  Code d’accès invité à l’album
                </label>
                <input
                  type="text"
                  value={formSettings.albumAccessCode || '2026'}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, albumAccessCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#183153]/25 text-sm font-mono"
                />
              </div>
            </div>
          </form>
        )}

        {/* ===================================================================
            ONGLET 2 : MODÉRATION DES PHOTOS & AJOUT OFFICIEL
        =================================================================== */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#183153]/15 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPhotoFilter(st)}
                    className={`px-3.5 py-2 text-xs font-medium cursor-pointer ${
                      photoFilter === st
                        ? 'bg-[#183153] text-[#FBF8F1]'
                        : 'bg-[#FBF8F1] text-[#19263B] border border-[#183153]/20'
                    }`}
                  >
                    {st === 'all'
                      ? `Toutes (${photos.length})`
                      : st === 'pending'
                      ? `En attente (${photos.filter((p) => p.status === 'pending').length})`
                      : st === 'approved'
                      ? `Approuvées (${photos.filter((p) => p.status === 'approved').length})`
                      : `Refusées (${photos.filter((p) => p.status === 'rejected').length})`}
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B89158] text-[#101D35] text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-[#c9a369]">
                <Upload className="w-4 h-4" />
                <span>{uploadingOfficial ? 'Envoi...' : 'Publier une photo officielle'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadOfficialPhoto}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo._id}
                  className="bg-white border border-[#183153]/15 p-4 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden bg-[#101D35] mb-3 relative">
                      <img
                        src={photo.url}
                        alt={photo.caption || photo.authorName}
                        className="w-full h-full object-cover object-top"
                      />
                      <span
                        className={`absolute top-2 right-2 px-2.5 py-1 text-[11px] font-semibold uppercase ${
                          photo.status === 'approved'
                            ? 'bg-emerald-900 text-white'
                            : photo.status === 'rejected'
                            ? 'bg-red-900 text-white'
                            : 'bg-[#B89158] text-[#101D35]'
                        }`}
                      >
                        {photo.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#183153] mb-2">
                      Auteur : {photo.authorName} {photo.isOfficial ? '(Officielle)' : ''}
                    </p>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingCaptions[photo._id] ?? photo.caption}
                        onChange={(e) =>
                          setEditingCaptions({ ...editingCaptions, [photo._id]: e.target.value })
                        }
                        placeholder="Légende..."
                        className="flex-1 px-2.5 py-1.5 border border-[#183153]/25 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleModeratePhoto(photo._id, {
                            caption: editingCaptions[photo._id] ?? photo.caption,
                          })
                        }
                        className="px-2.5 py-1.5 bg-[#E8EEF6] text-[#183153] text-xs font-medium cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#183153]/10">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleModeratePhoto(photo._id, { status: 'approved' })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 text-white text-xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approuver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeratePhoto(photo._id, { status: 'rejected' })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-800 text-white text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Refuser</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo._id)}
                      aria-label="Supprimer définitivement"
                      className="p-1.5 text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================
            ONGLET 3 : ANNONCES DE DERNIÈRE MINUTE
        =================================================================== */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleCreateAnnouncement}
              className="lg:col-span-5 bg-white border border-[#183153]/15 p-6 space-y-4"
            >
              <h2 className="font-serif text-2xl text-[#101D35]">
                Publier une information de dernière minute
              </h2>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1">
                  Catégorie
                </label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#183153]/25 text-sm bg-white"
                >
                  <option value="access">Précision d’accès</option>
                  <option value="schedule">Changement d’horaire</option>
                  <option value="organization">Message de l’organisation</option>
                  <option value="info">Information générale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1">
                  Titre (FR) *
                </label>
                <input
                  type="text"
                  required
                  value={annTitleFr}
                  onChange={(e) => setAnnTitleFr(e.target.value)}
                  placeholder="Ex. : Repère d’entrée au village..."
                  className="w-full px-3 py-2 border border-[#183153]/25 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-1">
                  Message (FR) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={annContentFr}
                  onChange={(e) => setAnnContentFr(e.target.value)}
                  className="w-full px-3 py-2 border border-[#183153]/25 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#183153] text-[#FBF8F1] text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publier l’annonce</span>
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              {announcements.length === 0 ? (
                <div className="bg-white border border-[#183153]/15 p-8 text-center text-sm text-[#19263B]/70">
                  Aucune annonce active en haut du site.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann._id}
                    className="bg-white border border-[#183153]/15 p-5 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#B89158] mb-1">
                        {ann.category}
                      </p>
                      <h3 className="font-serif text-xl text-[#101D35]">{ann.titleFr}</h3>
                      <p className="text-sm text-[#19263B]/80 mt-1">{ann.contentFr}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann._id)}
                      className="p-2 text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            ONGLET 4 : QR CODE DE L'ALBUM PARTICIPATIF
        =================================================================== */}
        {activeTab === 'qrcode' && (
          <div className="bg-white border border-[#183153]/15 p-8 sm:p-12 max-w-xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-3xl text-[#101D35]">
              QR Code vers la page de contribution
            </h2>
            <p className="text-sm text-[#19263B]/80 leading-relaxed">
              Imprimez ou présentez ce QR code aux invités lors de la cérémonie à Bangangté. Il pointe directement vers la page de partage de photos, sans inclure aucun secret d’administration.
            </p>
            <div className="inline-block p-6 bg-[#FBF8F1] border border-[#183153]/20">
              <QRCodeSVG
                value={contributionUrl}
                size={220}
                bgColor="#FBF8F1"
                fgColor="#101D35"
                level="M"
              />
            </div>
            <p className="font-mono text-xs text-[#315783] break-all">
              {contributionUrl}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
