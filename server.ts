import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { createClient } from '@sanity/client';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// ============================================================================
// CONFIGURATION SANITY CMS (Server-Side Secure Client)
// ============================================================================
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'waphlwvv';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_ORG_ID = process.env.SANITY_ORG_ID || 'oh314dkvd';
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN || '';

const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2024-03-01',
  token: SANITY_API_TOKEN,
  useCdn: false,
});

// ============================================================================
// AUTHENTIFICATION & SESSIONS SERVEUR
// ============================================================================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'roland-jasmine';
const ADMIN_ALT_USERNAME = 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DotBangangte2026';
const DEFAULT_ALBUM_CODE = process.env.ALBUM_ACCESS_CODE || '2026';

interface SessionRecord {
  role: 'admin' | 'guest_album';
  expiresAt: number;
}

const activeSessions = new Map<string, SessionRecord>();
const loginRateLimits = new Map<string, { count: number; resetAt: number }>();

function createSession(role: 'admin' | 'guest_album', durationMs: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    role,
    expiresAt: Date.now() + durationMs,
  });
  return token;
}

function verifySession(req: express.Request, requiredRole: 'admin' | 'guest_album'): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  if (requiredRole === 'guest_album' && (session.role === 'guest_album' || session.role === 'admin')) {
    return true;
  }
  return session.role === requiredRole;
}

// ============================================================================
// STOCKAGE LOCAL DE SECOURS & PHOTOS OFFICIELLES INITIALES
// ============================================================================
const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const BACKUP_FILE = path.join(DATA_DIR, 'store.json');

export interface EventSettingsData {
  groomName: string;
  brideName: string;
  eventDate: string;
  eventStartTime: string | null;
  eventEndTime: string | null;
  timeZone: string;
  region: string;
  city: string;
  villageName: string;
  venueName: string;
  address: string;
  mapsUrl: string;
  directions: string;
  dressCode: string;
  parkingInfo: string;
  accommodationInfo: string;
  accessibilityInfo: string;
  couplePhotoUrl: string;
  parentsNames: string[];
  groomFamilyPhotoUrl: string;
  brideFamilyPhotoUrl: string;
  coupleWordFr: string;
  coupleWordEn: string;
  coupleStoryFr: string;
  coupleStoryEn: string;
  symbolicSharingNoteFr: string;
  symbolicSharingNoteEn: string;
  whatsappNumber: string;
  whatsappDisplayNumber: string;
  defaultLocale: 'fr' | 'en';
  supportedLocales: ('fr' | 'en')[];
  siteUrl: string;
  contributionsOpen: boolean;
  albumPrivate: boolean;
  albumAccessCode: string;
  retentionMonths: number;
}

export interface AnnouncementItem {
  _id: string;
  titleFr: string;
  titleEn: string;
  contentFr: string;
  contentEn: string;
  category: 'access' | 'schedule' | 'organization' | 'info';
  active: boolean;
  createdAt: string;
}

export interface PhotoItem {
  _id: string;
  url: string;
  authorName: string;
  showAuthorName: boolean;
  caption: string;
  status: 'pending' | 'approved' | 'rejected';
  isOfficial: boolean;
  createdAt: string;
}

const DEFAULT_SETTINGS: EventSettingsData = {
  groomName: 'Nguepi Roland',
  brideName: 'Guessi Jasmine',
  eventDate: '2026-12-01',
  eventStartTime: null,
  eventEndTime: null,
  timeZone: 'Africa/Douala',
  region: 'Ouest',
  city: 'Bangangté',
  villageName: '',
  venueName: '',
  address: '',
  mapsUrl: '',
  directions: '',
  dressCode: '',
  parkingInfo: '',
  accommodationInfo: '',
  accessibilityInfo: '',
  couplePhotoUrl: '/assets/aistudio/a1f54cc2d911c8dabd7922cca2507e10_34dc280b.jpg',
  parentsNames: [],
  groomFamilyPhotoUrl: '',
  brideFamilyPhotoUrl: '',
  coupleWordFr: '',
  coupleWordEn: '',
  coupleStoryFr: '',
  coupleStoryEn: '',
  symbolicSharingNoteFr: '',
  symbolicSharingNoteEn: '',
  whatsappNumber: '33753049353',
  whatsappDisplayNumber: '+33 7 53 04 93 53',
  defaultLocale: 'fr',
  supportedLocales: ['fr', 'en'],
  siteUrl: '',
  contributionsOpen: true,
  albumPrivate: false,
  albumAccessCode: DEFAULT_ALBUM_CODE,
  retentionMonths: 24,
};

const INITIAL_OFFICIAL_PHOTOS: PhotoItem[] = [
  {
    _id: 'official-photo-1',
    url: '/assets/aistudio/a1f54cc2d911c8dabd7922cca2507e10_34dc280b.jpg',
    authorName: 'Collection Officielle',
    showAuthorName: true,
    caption: 'Nguepi Roland & Guessi Jasmine — Regard complice en tenue d’apparat indigo.',
    status: 'approved',
    isOfficial: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    _id: 'official-photo-2',
    url: '/assets/aistudio/fd42f998cc174303d779ba2f184e1775_39b39a14.jpg',
    authorName: 'Collection Officielle',
    showAuthorName: true,
    caption: 'Élégance royale et motifs inspirés du patrimoine traditionnel.',
    status: 'approved',
    isOfficial: true,
    createdAt: '2026-10-01T10:05:00.000Z',
  },
  {
    _id: 'official-photo-3',
    url: '/assets/aistudio/267471665367741484_b9b446cc.jpg',
    authorName: 'Collection Officielle',
    showAuthorName: true,
    caption: 'Harmonie des silhouettes et noblesse du drapé indigo.',
    status: 'approved',
    isOfficial: true,
    createdAt: '2026-10-01T10:10:00.000Z',
  },
  {
    _id: 'official-photo-4',
    url: '/assets/aistudio/f0bc0dca8eae81fb94c2436bb59fc2ba_737570bd.jpg',
    authorName: 'Collection Officielle',
    showAuthorName: true,
    caption: 'Le marié arborant les attributs de dignité et de tradition.',
    status: 'approved',
    isOfficial: true,
    createdAt: '2026-10-01T10:15:00.000Z',
  },
  {
    _id: 'official-photo-5',
    url: '/assets/aistudio/Bridal_Bliss__Inside_Influencer_Gina_B____Yanis____cb4bf9f0.jpg',
    authorName: 'Collection Officielle',
    showAuthorName: true,
    caption: 'Décor traditionnel de réception paré d’étoffes Ndop et de présents symboliques.',
    status: 'approved',
    isOfficial: true,
    createdAt: '2026-10-01T10:20:00.000Z',
  },
];

interface LocalStore {
  settings: EventSettingsData;
  announcements: AnnouncementItem[];
  photos: PhotoItem[];
}

function readLocalStore(): LocalStore {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
        photos: Array.isArray(parsed.photos) && parsed.photos.length > 0 ? parsed.photos : INITIAL_OFFICIAL_PHOTOS,
      };
    }
  } catch (e) {
    console.error('Error reading local backup store:', e);
  }
  return {
    settings: { ...DEFAULT_SETTINGS },
    announcements: [],
    photos: [...INITIAL_OFFICIAL_PHOTOS],
  };
}

function writeLocalStore(store: LocalStore) {
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local backup store:', e);
  }
}

// Sync helper with Sanity CMS
async function fetchFromSanityOrFallback(): Promise<{
  settings: EventSettingsData;
  announcements: AnnouncementItem[];
  photos: PhotoItem[];
  sanityConnected: boolean;
}> {
  const local = readLocalStore();
  try {
    const query = `{
      "settings": *[_type == "weddingSettings" && _id == "weddingSettings-main"][0],
      "announcements": *[_type == "weddingAnnouncement"] | order(createdAt desc),
      "photos": *[_type == "weddingPhoto"] | order(createdAt desc) {
        _id,
        "url": coalesce(imageUrl, image.asset->url),
        authorName,
        showAuthorName,
        caption,
        status,
        isOfficial,
        createdAt
      }
    }`;
    const result = await sanityClient.fetch(query);

    let mergedSettings = { ...local.settings };
    if (result?.settings) {
      const s = result.settings;
      mergedSettings = {
        ...mergedSettings,
        groomName: s.groomName ?? mergedSettings.groomName,
        brideName: s.brideName ?? mergedSettings.brideName,
        eventDate: s.eventDate ?? mergedSettings.eventDate,
        eventStartTime: s.eventStartTime || null,
        eventEndTime: s.eventEndTime || null,
        timeZone: s.timeZone ?? mergedSettings.timeZone,
        region: s.region ?? mergedSettings.region,
        city: s.city ?? mergedSettings.city,
        villageName: s.villageName ?? mergedSettings.villageName,
        venueName: s.venueName ?? mergedSettings.venueName,
        address: s.address ?? mergedSettings.address,
        mapsUrl: s.mapsUrl ?? mergedSettings.mapsUrl,
        directions: s.directions ?? mergedSettings.directions,
        dressCode: s.dressCode ?? mergedSettings.dressCode,
        parkingInfo: s.parkingInfo ?? mergedSettings.parkingInfo,
        accommodationInfo: s.accommodationInfo ?? mergedSettings.accommodationInfo,
        accessibilityInfo: s.accessibilityInfo ?? mergedSettings.accessibilityInfo,
        couplePhotoUrl: s.couplePhotoUrl ?? mergedSettings.couplePhotoUrl,
        parentsNames: Array.isArray(s.parentsNames) ? s.parentsNames : mergedSettings.parentsNames,
        groomFamilyPhotoUrl: s.groomFamilyPhotoUrl ?? mergedSettings.groomFamilyPhotoUrl,
        brideFamilyPhotoUrl: s.brideFamilyPhotoUrl ?? mergedSettings.brideFamilyPhotoUrl,
        coupleWordFr: s.coupleWordFr ?? mergedSettings.coupleWordFr,
        coupleWordEn: s.coupleWordEn ?? mergedSettings.coupleWordEn,
        coupleStoryFr: s.coupleStoryFr ?? mergedSettings.coupleStoryFr,
        coupleStoryEn: s.coupleStoryEn ?? mergedSettings.coupleStoryEn,
        symbolicSharingNoteFr: s.symbolicSharingNoteFr ?? mergedSettings.symbolicSharingNoteFr,
        symbolicSharingNoteEn: s.symbolicSharingNoteEn ?? mergedSettings.symbolicSharingNoteEn,
        whatsappNumber: s.whatsappNumber ?? mergedSettings.whatsappNumber,
        whatsappDisplayNumber: s.whatsappDisplayNumber ?? mergedSettings.whatsappDisplayNumber,
        contributionsOpen: typeof s.contributionsOpen === 'boolean' ? s.contributionsOpen : mergedSettings.contributionsOpen,
        albumPrivate: typeof s.albumPrivate === 'boolean' ? s.albumPrivate : mergedSettings.albumPrivate,
        albumAccessCode: s.albumAccessCode || mergedSettings.albumAccessCode,
        retentionMonths: s.retentionMonths ?? mergedSettings.retentionMonths,
      };
    } else {
      // Seed initial document into Sanity so the organizers see it immediately in Sanity Studio
      await sanityClient.createIfNotExists({
        _id: 'weddingSettings-main',
        _type: 'weddingSettings',
        ...mergedSettings,
      }).catch(() => {});
    }

    const sanityPhotos: PhotoItem[] = Array.isArray(result?.photos) ? result.photos.filter((p: PhotoItem) => Boolean(p.url)) : [];
    // Combine Sanity photos with our 5 initial official photos if they aren't removed
    const combinedPhotosMap = new Map<string, PhotoItem>();
    for (const p of local.photos) {
      combinedPhotosMap.set(p._id, p);
    }
    for (const p of sanityPhotos) {
      combinedPhotosMap.set(p._id, p);
    }
    const mergedPhotos = Array.from(combinedPhotosMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const sanityAnnouncements: AnnouncementItem[] = Array.isArray(result?.announcements) && result.announcements.length > 0
      ? result.announcements
      : local.announcements;

    writeLocalStore({
      settings: mergedSettings,
      announcements: sanityAnnouncements,
      photos: mergedPhotos,
    });

    return {
      settings: mergedSettings,
      announcements: sanityAnnouncements,
      photos: mergedPhotos,
      sanityConnected: true,
    };
  } catch (err) {
    return {
      ...local,
      sanityConnected: false,
    };
  }
}

// ============================================================================
// VALIDATION DES FICHIERS IMAGES (Magic Bytes & Limites)
// ============================================================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo max par fichier
    files: 10, // 10 fichiers max par envoi
  },
});

function validateImageMagicBytes(buffer: Buffer): { valid: boolean; mime?: string; ext?: string } {
  if (buffer.length < 12) return { valid: false };
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mime: 'image/jpeg', ext: 'jpg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mime: 'image/png', ext: 'png' };
  }
  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, mime: 'image/webp', ext: 'webp' };
  }
  return { valid: false };
}

// ============================================================================
// ROUTES API PUBLIQUES
// ============================================================================

app.get('/api/bootstrap', async (req, res) => {
  const data = await fetchFromSanityOrFallback();
  const { albumAccessCode, ...publicSettings } = data.settings;

  const isAdmin = verifySession(req, 'admin');
  const hasAlbumAccess = !data.settings.albumPrivate || verifySession(req, 'guest_album') || isAdmin;

  // Les invités ne voient JAMAIS les photos en attente ou refusées
  const approvedPhotos = hasAlbumAccess
    ? data.photos
        .filter((p) => p.status === 'approved')
        .map((p) => ({
          _id: p._id,
          url: p.url,
          authorName: p.showAuthorName ? p.authorName : '',
          showAuthorName: p.showAuthorName,
          caption: p.caption,
          isOfficial: p.isOfficial,
          createdAt: p.createdAt,
        }))
    : [];

  const activeAnnouncements = data.announcements.filter((a) => a.active);

  res.json({
    settings: publicSettings,
    announcements: activeAnnouncements,
    photos: approvedPhotos,
    albumLocked: data.settings.albumPrivate && !hasAlbumAccess,
    sanityConnected: data.sanityConnected,
    sanityProjectId: SANITY_PROJECT_ID,
    sanityDataset: SANITY_DATASET,
  });
});

// Vérification du code d'accès invité si l'album familial est en mode privé
app.post('/api/album/unlock', async (req, res) => {
  const { code } = req.body || {};
  const data = await fetchFromSanityOrFallback();
  const expectedCode = (data.settings.albumAccessCode || DEFAULT_ALBUM_CODE).trim();

  if (!code || String(code).trim() !== expectedCode) {
    res.status(401).json({ error: 'INVALID_CODE' });
    return;
  }

  const token = createSession('guest_album', 1000 * 60 * 60 * 12); // 12 heures
  res.json({ token, expiresIn: 43200 });
});

// Envoi d'une photo par un invité (Stockage Sanity Assets + Document de modération)
const uploadRateLimits = new Map<string, { count: number; resetAt: number }>();

app.post('/api/photos/upload', upload.single('photo'), async (req, res) => {
  try {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const limitRecord = uploadRateLimits.get(ip);
    if (limitRecord && now < limitRecord.resetAt) {
      if (limitRecord.count >= 30) {
        res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
        return;
      }
      limitRecord.count += 1;
    } else {
      uploadRateLimits.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    }

    const data = await fetchFromSanityOrFallback();
    const isAdmin = verifySession(req, 'admin');

    if (!data.settings.contributionsOpen && !isAdmin) {
      res.status(403).json({ error: 'CONTRIBUTIONS_CLOSED' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'MISSING_FILE' });
      return;
    }

    const validation = validateImageMagicBytes(file.buffer);
    if (!validation.valid) {
      res.status(400).json({ error: 'INVALID_FILE_TYPE' });
      return;
    }

    const authorName = String(req.body.authorName || '').trim().slice(0, 80);
    const caption = String(req.body.caption || '').trim().slice(0, 300);
    const showAuthorName = req.body.showAuthorName === 'true' || req.body.showAuthorName === true;
    const consent = req.body.consent === 'true' || req.body.consent === true;
    const isOfficialUpload = isAdmin && (req.body.isOfficial === 'true' || req.body.isOfficial === true);

    if (!authorName) {
      res.status(400).json({ error: 'MISSING_AUTHOR' });
      return;
    }
    if (!consent && !isAdmin) {
      res.status(400).json({ error: 'MISSING_CONSENT' });
      return;
    }

    const randomFilename = `souvenir_${crypto.randomBytes(12).toString('hex')}.${validation.ext}`;
    let uploadedAssetUrl = '';
    let sanityAssetId = '';

    // 1. Upload du binaire image vers Sanity Assets
    try {
      const asset = await sanityClient.assets.upload('image', file.buffer, {
        filename: randomFilename,
        contentType: validation.mime,
      });
      uploadedAssetUrl = asset.url;
      sanityAssetId = asset._id;
    } catch (sanityErr) {
      console.error('Sanity asset upload fallback to local public uploads:', sanityErr);
      const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localPath = path.join(uploadsDir, randomFilename);
      fs.writeFileSync(localPath, file.buffer);
      uploadedAssetUrl = `/uploads/${randomFilename}`;
    }

    const photoId = `weddingPhoto-${crypto.randomBytes(10).toString('hex')}`;
    const initialStatus: 'pending' | 'approved' = isOfficialUpload ? 'approved' : 'pending';

    const newPhoto: PhotoItem = {
      _id: photoId,
      url: uploadedAssetUrl,
      authorName,
      showAuthorName,
      caption,
      status: initialStatus,
      isOfficial: isOfficialUpload,
      createdAt: new Date().toISOString(),
    };

    // 2. Création du document dans Sanity
    try {
      await sanityClient.create({
        _id: photoId,
        _type: 'weddingPhoto',
        imageUrl: uploadedAssetUrl,
        ...(sanityAssetId
          ? {
              image: {
                _type: 'image',
                asset: {
                  _type: 'reference',
                  _ref: sanityAssetId,
                },
              },
            }
          : {}),
        authorName,
        showAuthorName,
        caption,
        status: initialStatus,
        isOfficial: isOfficialUpload,
        createdAt: newPhoto.createdAt,
      });
    } catch (docErr) {
      console.error('Sanity document creation fallback:', docErr);
    }

    // 3. Sauvegarde locale synchronisée
    const store = readLocalStore();
    store.photos.unshift(newPhoto);
    writeLocalStore(store);

    res.status(201).json({
      success: true,
      photo: {
        _id: newPhoto._id,
        status: newPhoto.status,
      },
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'UPLOAD_FAILED' });
  }
});

// ============================================================================
// ROUTES D'ADMINISTRATION PROTÉGÉES (/api/admin/*)
// ============================================================================

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const rate = loginRateLimits.get(ip);
  if (rate && now < rate.resetAt && rate.count >= 8) {
    res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
    return;
  }

  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  const validUser =
    cleanUser === ADMIN_USERNAME.toLowerCase() ||
    cleanUser === ADMIN_ALT_USERNAME.toLowerCase() ||
    cleanUser === 'nguepi' ||
    cleanUser === 'guessi';
  const validPass = cleanPass === ADMIN_PASSWORD;

  if (!validUser || !validPass) {
    loginRateLimits.set(ip, {
      count: (rate?.count || 0) + 1,
      resetAt: now + 15 * 60 * 1000,
    });
    res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    return;
  }

  loginRateLimits.delete(ip);
  const token = createSession('admin', 1000 * 60 * 60 * 24); // 24h
  res.json({
    token,
    username: cleanUser,
    sanityProjectId: SANITY_PROJECT_ID,
    sanityOrgId: SANITY_ORG_ID,
    sanityDataset: SANITY_DATASET,
  });
});

app.get('/api/admin/dashboard', async (req, res) => {
  if (!verifySession(req, 'admin')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  const data = await fetchFromSanityOrFallback();
  res.json({
    settings: data.settings,
    announcements: data.announcements,
    photos: data.photos,
    sanityConnected: data.sanityConnected,
    sanityInfo: {
      projectId: SANITY_PROJECT_ID,
      organizationId: SANITY_ORG_ID,
      dataset: SANITY_DATASET,
    },
  });
});

// Mise à jour des paramètres de l'événement (Sanity + Local Store)
app.put('/api/admin/settings', async (req, res) => {
  if (!verifySession(req, 'admin')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const updates = req.body || {};
  const store = readLocalStore();

  const updatedSettings: EventSettingsData = {
    ...store.settings,
    groomName: String(updates.groomName ?? store.settings.groomName).trim() || 'Nguepi Roland',
    brideName: String(updates.brideName ?? store.settings.brideName).trim() || 'Guessi Jasmine',
    eventDate: String(updates.eventDate ?? store.settings.eventDate).trim() || '2026-12-01',
    eventStartTime: updates.eventStartTime ? String(updates.eventStartTime).trim() : null,
    eventEndTime: updates.eventEndTime ? String(updates.eventEndTime).trim() : null,
    villageName: String(updates.villageName ?? store.settings.villageName).trim(),
    venueName: String(updates.venueName ?? store.settings.venueName).trim(),
    address: String(updates.address ?? store.settings.address).trim(),
    mapsUrl: String(updates.mapsUrl ?? store.settings.mapsUrl).trim(),
    directions: String(updates.directions ?? store.settings.directions).trim(),
    dressCode: String(updates.dressCode ?? store.settings.dressCode).trim(),
    parkingInfo: String(updates.parkingInfo ?? store.settings.parkingInfo).trim(),
    accommodationInfo: String(updates.accommodationInfo ?? store.settings.accommodationInfo).trim(),
    accessibilityInfo: String(updates.accessibilityInfo ?? store.settings.accessibilityInfo).trim(),
    couplePhotoUrl: String(updates.couplePhotoUrl ?? store.settings.couplePhotoUrl).trim(),
    parentsNames: Array.isArray(updates.parentsNames)
      ? updates.parentsNames.map((n: string) => String(n).trim()).filter(Boolean)
      : store.settings.parentsNames,
    groomFamilyPhotoUrl: String(updates.groomFamilyPhotoUrl ?? store.settings.groomFamilyPhotoUrl).trim(),
    brideFamilyPhotoUrl: String(updates.brideFamilyPhotoUrl ?? store.settings.brideFamilyPhotoUrl).trim(),
    coupleWordFr: String(updates.coupleWordFr ?? store.settings.coupleWordFr).trim(),
    coupleWordEn: String(updates.coupleWordEn ?? store.settings.coupleWordEn).trim(),
    coupleStoryFr: String(updates.coupleStoryFr ?? store.settings.coupleStoryFr).trim(),
    coupleStoryEn: String(updates.coupleStoryEn ?? store.settings.coupleStoryEn).trim(),
    symbolicSharingNoteFr: String(updates.symbolicSharingNoteFr ?? store.settings.symbolicSharingNoteFr).trim(),
    symbolicSharingNoteEn: String(updates.symbolicSharingNoteEn ?? store.settings.symbolicSharingNoteEn).trim(),
    whatsappNumber: String(updates.whatsappNumber ?? store.settings.whatsappNumber).replace(/[^\d]/g, '') || '33753049353',
    whatsappDisplayNumber: String(updates.whatsappDisplayNumber ?? store.settings.whatsappDisplayNumber).trim() || '+33 7 53 04 93 53',
    contributionsOpen: typeof updates.contributionsOpen === 'boolean' ? updates.contributionsOpen : store.settings.contributionsOpen,
    albumPrivate: typeof updates.albumPrivate === 'boolean' ? updates.albumPrivate : store.settings.albumPrivate,
    albumAccessCode: String(updates.albumAccessCode ?? store.settings.albumAccessCode).trim() || '2026',
    retentionMonths: Number(updates.retentionMonths) || 24,
  };

  store.settings = updatedSettings;
  writeLocalStore(store);

  let sanityUpdated = false;
  try {
    await sanityClient.createOrReplace({
      _id: 'weddingSettings-main',
      _type: 'weddingSettings',
      ...updatedSettings,
    });
    sanityUpdated = true;
  } catch (err) {
    console.error('Sanity settings update error:', err);
  }

  res.json({
    success: true,
    settings: updatedSettings,
    sanityUpdated,
  });
});

// Modération d'une photo (Approuver, Refuser, Modifier la légende)
app.patch('/api/admin/photos/:id', async (req, res) => {
  if (!verifySession(req, 'admin')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const { id } = req.params;
  const { status, caption, showAuthorName } = req.body || {};

  const store = readLocalStore();
  const photoIndex = store.photos.findIndex((p) => p._id === id);

  if (photoIndex !== -1) {
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      store.photos[photoIndex].status = status;
    }
    if (typeof caption === 'string') {
      store.photos[photoIndex].caption = caption.trim().slice(0, 300);
    }
    if (typeof showAuthorName === 'boolean') {
      store.photos[photoIndex].showAuthorName = showAuthorName;
    }
    writeLocalStore(store);
  }

  try {
    const patch = sanityClient.patch(id);
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      patch.set({ status });
    }
    if (typeof caption === 'string') {
      patch.set({ caption: caption.trim().slice(0, 300) });
    }
    if (typeof showAuthorName === 'boolean') {
      patch.set({ showAuthorName });
    }
    await patch.commit();
  } catch (err) {
    // Photo might be an initial official photo not yet created in Sanity; upsert it
    if (photoIndex !== -1) {
      await sanityClient
        .createOrReplace({
          _id: store.photos[photoIndex]._id,
          _type: 'weddingPhoto',
          imageUrl: store.photos[photoIndex].url,
          authorName: store.photos[photoIndex].authorName,
          showAuthorName: store.photos[photoIndex].showAuthorName,
          caption: store.photos[photoIndex].caption,
          status: store.photos[photoIndex].status,
          isOfficial: store.photos[photoIndex].isOfficial,
          createdAt: store.photos[photoIndex].createdAt,
        })
        .catch(() => {});
    }
  }

  res.json({
    success: true,
    photo: photoIndex !== -1 ? store.photos[photoIndex] : null,
  });
});

// Suppression d'une photo et de ses métadonnées
app.delete('/api/admin/photos/:id', async (req, res) => {
  if (!verifySession(req, 'admin')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const { id } = req.params;
  const store = readLocalStore();
  store.photos = store.photos.filter((p) => p._id !== id);
  writeLocalStore(store);

  try {
    await sanityClient.delete(id);
  } catch (err) {
    console.error('Sanity delete photo note:', err);
  }

  res.json({ success: true });
});

// Création d'une annonce de dernière minute
app.post('/api/admin/announcements', async (req, res) => {
  if (!verifySession(req, 'admin')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const { titleFr, titleEn, contentFr, contentEn, category } = req.body || {};
  if (!titleFr || !contentFr) {
    res.status(400).json({ error: 'MISSING_FIELDS' });
    return;
  }

  const newAnnouncement: AnnouncementItem = {
    _id: `announcement-${crypto.randomBytes(8).toString('hex')}`,
    titleFr: String(titleFr).trim(),
    titleEn: String(titleEn || titleFr).trim(),
    contentFr: String(contentFr).trim(),
    contentEn: String(contentEn || contentFr).trim(),
    category: ['access', 'schedule', 'organization', 'info'].includes(category) ? category : 'info',
    active: true,
    createdAt: new Date().toISOString(),
  };

  const store = readLocalStore();
  store.announcements.unshift(newAnnouncement);
  writeLocalStore(store);

  try {
    await sanityClient.create({
      _type: 'weddingAnnouncement',
      ...newAnnouncement,
    });
  } catch (err) {
    console.error('Sanity announcement create error:', err);
  }

  res.status(201).json({ success: true, announcement: newAnnouncement });
});

// Activation / Désactivation ou suppression d'une annonce
app.delete('/api/admin/announcements/:id', async (req, res) => {
  if (!verifySession(req, 'admin')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const { id } = req.params;
  const store = readLocalStore();
  store.announcements = store.announcements.filter((a) => a._id !== id);
  writeLocalStore(store);

  try {
    await sanityClient.delete(id);
  } catch (err) {
    console.error('Sanity delete announcement error:', err);
  }

  res.json({ success: true });
});

// ============================================================================
// DÉMARRAGE DU SERVEUR (VITE MIDDLEWARE EN DEV / STATIC EN PROD)
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(async (req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
          const host = req.headers['x-forwarded-host'] || req.headers.host || '';
          const origin = host ? `${protocol}://${host}` : '';
          if (origin) {
            template = template.replace(
              /content="\/assets\/aistudio\/a1f54cc2d911c8dabd7922cca2507e10_34dc280b\.jpg"/g,
              `content="${origin}/assets/aistudio/a1f54cc2d911c8dabd7922cca2507e10_34dc280b.jpg"`
            );
          }
          const html = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
          return;
        } catch (e) {
          next(e);
          return;
        }
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      try {
        let html = fs.readFileSync(indexPath, 'utf-8');
        const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || '';
        const origin = host ? `${protocol}://${host}` : '';
        if (origin) {
          html = html.replace(
            /content="\/assets\/aistudio\/a1f54cc2d911c8dabd7922cca2507e10_34dc280b\.jpg"/g,
            `content="${origin}/assets/aistudio/a1f54cc2d911c8dabd7922cca2507e10_34dc280b.jpg"`
          );
        }
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch {
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
