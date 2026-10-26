-- ============================================================================
-- MIGRATION SQL & POLITIQUES RLS (Supabase / PostgreSQL)
-- Mariage Traditionnel — Nguepi Roland & Guessi Jasmine
-- ============================================================================

-- 1. Table event_settings : Configuration dynamique de l'événement
CREATE TABLE IF NOT EXISTS public.event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groom_name TEXT NOT NULL DEFAULT 'Nguepi Roland',
  bride_name TEXT NOT NULL DEFAULT 'Guessi Jasmine',
  event_date DATE NOT NULL DEFAULT '2026-12-01',
  event_start_time TEXT DEFAULT NULL,
  event_end_time TEXT DEFAULT NULL,
  time_zone TEXT NOT NULL DEFAULT 'Africa/Douala',
  region TEXT NOT NULL DEFAULT 'Ouest',
  city TEXT NOT NULL DEFAULT 'Bangangté',
  village_name TEXT NOT NULL DEFAULT '',
  venue_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  maps_url TEXT NOT NULL DEFAULT '',
  directions TEXT NOT NULL DEFAULT '',
  dress_code TEXT NOT NULL DEFAULT '',
  parking_info TEXT NOT NULL DEFAULT '',
  accommodation_info TEXT NOT NULL DEFAULT '',
  accessibility_info TEXT NOT NULL DEFAULT '',
  couple_word_fr TEXT NOT NULL DEFAULT '',
  couple_word_en TEXT NOT NULL DEFAULT '',
  couple_story_fr TEXT NOT NULL DEFAULT '',
  couple_story_en TEXT NOT NULL DEFAULT '',
  symbolic_sharing_note_fr TEXT NOT NULL DEFAULT '',
  symbolic_sharing_note_en TEXT NOT NULL DEFAULT '',
  parents_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  whatsapp_number TEXT NOT NULL DEFAULT '33753049353',
  whatsapp_display_number TEXT NOT NULL DEFAULT '+33 7 53 04 93 53',
  contributions_open BOOLEAN NOT NULL DEFAULT true,
  album_private BOOLEAN NOT NULL DEFAULT false,
  retention_months INTEGER NOT NULL DEFAULT 24,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table announcements : Informations de dernière minute
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  content_fr TEXT NOT NULL,
  content_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'info' CHECK (category IN ('access', 'schedule', 'organization', 'info')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table photo_submissions : Envois groupés par invité
CREATE TABLE IF NOT EXISTS public.photo_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  show_author_name BOOLEAN NOT NULL DEFAULT true,
  consent_given BOOLEAN NOT NULL DEFAULT true CHECK (consent_given = true),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table photos : Métadonnées et références des photos de la galerie
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.photo_submissions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  author_name TEXT NOT NULL,
  show_author_name BOOLEAN NOT NULL DEFAULT true,
  caption TEXT NOT NULL DEFAULT '',
  is_official BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Lecture publique sur event_settings
CREATE POLICY "Public read event_settings"
  ON public.event_settings FOR SELECT
  USING (true);

-- Modification réservée aux administrateurs authentifiés
CREATE POLICY "Admin update event_settings"
  ON public.event_settings FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Lecture publique des annonces actives uniquement
CREATE POLICY "Public read active announcements"
  ON public.announcements FOR SELECT
  USING (active = true);

CREATE POLICY "Admin manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Les photos en attente (pending) ou refusées (rejected) sont invisibles au public
CREATE POLICY "Public read approved photos only"
  ON public.photos FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admin full access photos"
  ON public.photos FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access submissions"
  ON public.photo_submissions FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
