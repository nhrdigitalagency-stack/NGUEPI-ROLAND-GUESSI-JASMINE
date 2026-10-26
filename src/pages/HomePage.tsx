import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
  Share2,
  Check,
  CalendarPlus,
  MapPin,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Copy,
  Camera,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { NdopMotifFrieze, MonogramRJ } from '../components/NdopMotif';
import { NdopAmbientCanvas } from '../components/NdopAmbientCanvas';
import { CountdownStrip, HeroCountdownBadge } from '../components/CountdownStrip';
import { UnionPhotoCarousel } from '../components/UnionPhotoCarousel';
import { BangangteMap } from '../components/BangangteMap';
import { FAQ } from '../components/FAQ';
import { downloadWeddingIcs } from '../utils/icsGenerator';
import { officialGalleryShowcase } from '../config/weddingConfig';

/**
 * Composant d'animation basé sur IntersectionObserver (useInView de motion/react)
 * pour faire glisser les sections et cartes avec fluidité lors du défilement.
 */
const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
}> = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15, margin: '0px 0px -50px 0px' });

  const initialOffset =
    direction === 'up'
      ? { opacity: 0, y: 36 }
      : direction === 'left'
      ? { opacity: 0, x: -36 }
      : { opacity: 0, x: 36 };

  return (
    <motion.div
      ref={ref}
      initial={initialOffset}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : initialOffset}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const HomePage: React.FC = () => {
  const { t, locale, settings, announcements, photos } = useWedding();
  const location = useLocation();

  // État pour le partage de l'invitation
  const [linkCopied, setLinkCopied] = useState(false);

  // État pour l'accordéon du programme (étape 1 ouverte par défaut)
  const [openSteps, setOpenSteps] = useState<Record<number, boolean>>({ 0: true });

  // État du formulaire RSVP WhatsApp (conservé lors du changement de langue)
  const [rsvpFirstName, setRsvpFirstName] = useState('');
  const [rsvpLastName, setRsvpLastName] = useState('');
  const [rsvpAttendance, setRsvpAttendance] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [rsvpAdults, setRsvpAdults] = useState('0');
  const [rsvpChildren, setRsvpChildren] = useState('0');
  const [rsvpTravel, setRsvpTravel] = useState('');
  const [rsvpDietary, setRsvpDietary] = useState('');
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpErrors, setRsvpErrors] = useState<{
    firstName?: string;
    lastName?: string;
    adults?: string;
    children?: string;
  }>({});
  const [rsvpCopied, setRsvpCopied] = useState(false);

  // État du formulaire Message aux mariés
  const [wishName, setWishName] = useState('');
  const [wishText, setWishText] = useState('');
  const [wishError, setWishError] = useState('');
  const [wishCopied, setWishCopied] = useState(false);

  // Gestion des ancres au chargement
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);

  const handleShareInvitation = async () => {
    const shareUrl = window.location.origin;
    const shareTitle = `Bienvenue à la dot de ${settings.groomName} & ${settings.brideName}`;
    const shareText = `Bienvenue à la dot de ${settings.groomName}\n&\n${settings.brideName} — ${t.hero.dateDisplay} à ${settings.city}.`;
    const shareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {}
  };

  const toggleStep = (index: number) => {
    setOpenSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Construction du message WhatsApp RSVP exact selon les spécifications
  const buildRsvpWhatsappMessage = (): string => {
    const tpl = t.rsvp.whatsappTemplate;
    const attendanceLabel =
      rsvpAttendance === 'yes'
        ? locale === 'fr'
          ? 'Oui'
          : 'Yes'
        : rsvpAttendance === 'no'
        ? locale === 'fr'
          ? 'Non'
          : 'No'
        : locale === 'fr'
        ? 'Peut-être'
        : 'Maybe';

    const lines: string[] = [
      tpl.intro,
      '',
      `${tpl.lastName} : ${rsvpLastName.trim()}`,
      `${tpl.firstName} : ${rsvpFirstName.trim()}`,
      `${tpl.attendance} : ${attendanceLabel}`,
      `${tpl.adults} : ${Math.max(0, parseInt(rsvpAdults || '0', 10) || 0)}`,
      `${tpl.children} : ${Math.max(0, parseInt(rsvpChildren || '0', 10) || 0)}`,
    ];

    if (rsvpTravel.trim()) {
      lines.push(`${tpl.travel} : ${rsvpTravel.trim()}`);
    }
    if (rsvpDietary.trim()) {
      lines.push(`${tpl.dietary} : ${rsvpDietary.trim()}`);
    }
    if (rsvpMessage.trim()) {
      lines.push(`${tpl.message} : ${rsvpMessage.trim()}`);
    }

    return lines.join('\n');
  };

  const validateRsvp = (): boolean => {
    const errs: typeof rsvpErrors = {};
    if (!rsvpFirstName.trim()) {
      errs.firstName = t.rsvp.errors.firstNameRequired;
    }
    if (!rsvpLastName.trim()) {
      errs.lastName = t.rsvp.errors.lastNameRequired;
    }
    const adultsNum = Number(rsvpAdults);
    if (Number.isNaN(adultsNum) || adultsNum < 0) {
      errs.adults = t.rsvp.errors.invalidCount;
    }
    const childrenNum = Number(rsvpChildren);
    if (Number.isNaN(childrenNum) || childrenNum < 0) {
      errs.children = t.rsvp.errors.invalidCount;
    }
    setRsvpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRsvpCopyFallback = async () => {
    if (!validateRsvp()) return;
    const msg = buildRsvpWhatsappMessage();
    try {
      await navigator.clipboard.writeText(msg);
      setRsvpCopied(true);
      setTimeout(() => setRsvpCopied(false), 3500);
    } catch {}
  };

  const getRsvpWhatsappHref = (): string => {
    const cleanPhone = (settings.whatsappNumber || '33753049353').replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(buildRsvpWhatsappMessage());
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  // Construction du message aux mariés
  const buildCoupleWishMessage = (): string => {
    return `${t.coupleMessage.whatsappHeader}\n\nDe / From : ${wishName.trim()}\nMessage : ${wishText.trim()}`;
  };

  const getCoupleWishHref = (): string => {
    const cleanPhone = (settings.whatsappNumber || '33753049353').replace(/[^\d]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(buildCoupleWishMessage())}`;
  };

  const coupleWord = locale === 'fr' ? settings.coupleWordFr : settings.coupleWordEn || settings.coupleWordFr;
  const coupleStory = locale === 'fr' ? settings.coupleStoryFr : settings.coupleStoryEn || settings.coupleStoryFr;
  const symbolicNote =
    locale === 'fr'
      ? settings.symbolicSharingNoteFr
      : settings.symbolicSharingNoteEn || settings.symbolicSharingNoteFr;

  const isAfterEvent = new Date() > new Date(`${settings.eventDate}T23:59:59+01:00`);
  const previewPhotos =
    photos.length > 0
      ? photos.slice(0, 5)
      : officialGalleryShowcase.map((p) => ({
          _id: p.id,
          url: p.src,
          authorName: 'Collection Officielle',
          showAuthorName: false,
          caption: locale === 'fr' ? p.altFr : p.altEn,
          isOfficial: true,
          createdAt: '',
        }));

  const heroBgImage =
    settings.couplePhotoUrl || '/assets/aistudio/a1f54cc2d911c8dabd7922cca2507e10_34dc280b.jpg';

  return (
    <div className="relative">
      {/* Encart Administrable : Informations de dernière minute (uniquement si actif) */}
      {announcements.length > 0 && (
        <section
          aria-label={t.announcements.badge}
          className="bg-[#183153] text-[#FBF8F1] border-b border-[#B89158]/30 py-3.5 px-4"
        >
          <div className="max-w-7xl mx-auto space-y-2">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <Bell className="w-4 h-4 text-[#B89158] shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <span className="font-semibold text-[#B89158] mr-2">
                      {t.announcements.categories[ann.category] || t.announcements.badge} ·
                    </span>
                    <span className="font-medium text-[#FBF8F1] mr-2">
                      {locale === 'fr' ? ann.titleFr : ann.titleEn || ann.titleFr} :
                    </span>
                    <span className="text-[#E8EEF6]/90">
                      {locale === 'fr' ? ann.contentFr : ann.contentEn || ann.contentFr}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          SECTION 1 : HERO IMMERSIF
          - Image d'arrière-plan couvrant 100% du conteneur
          - Superposition noire à 40% d'opacité (bg-black/40) pour bien voir l'image
          - Texte au-dessus avec fort contraste
      ===================================================================== */}
      <section
        id="accueil"
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#101D35] py-20 lg:py-28"
      >
        {/* Image du couple couvrant intégralement le conteneur Hero */}
        <motion.div
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 w-full h-full"
        >
          <img
            src={heroBgImage}
            alt={`${settings.groomName} & ${settings.brideName}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center sm:object-top"
          />
        </motion.div>

        {/* Superposition noire en position absolue avec 40% d'opacité (bg-black/40) */}
        <div
          className="absolute inset-0 z-10 bg-black/40"
          aria-hidden="true"
        />

        {/* Canvas géométrique très léger n'altérant pas la visibilité de la photo */}
        <NdopAmbientCanvas className="absolute inset-0 z-10 w-full h-full opacity-20" />

        {/* Contenu texte au-dessus avec fort contraste */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="relative border border-[#B89158]/60 bg-black/20 p-7 sm:p-12 lg:p-16"
          >
            {/* Coins géométriques fins style faire-part */}
            <span
              className="absolute top-3 left-3 w-5 h-5 border-t border-l border-[#B89158]"
              aria-hidden="true"
            />
            <span
              className="absolute top-3 right-3 w-5 h-5 border-t border-r border-[#B89158]"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[#B89158]"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[#B89158]"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center mb-5"
            >
              <MonogramRJ size="md" variant="ivory" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="text-xs sm:text-sm font-semibold tracking-[0.22em] text-[#FBF8F1] uppercase mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
            >
              {t.hero.kicker}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl lg:text-6xl leading-[1.12] font-bold text-white tracking-tight mb-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
              style={{ textWrap: 'balance' }}
            >
              <span className="block">{settings.groomName}</span>
              <span className="block text-[#B89158] font-medium text-2xl sm:text-4xl my-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                &amp;
              </span>
              <span className="block">{settings.brideName}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.42 }}
              className="italic text-lg sm:text-2xl text-white font-medium mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
            >
              « {t.hero.signature} »
            </motion.p>

            <NdopMotifFrieze variant="light" className="my-6" />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.52 }}
              className="flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base font-semibold text-white py-2 mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
            >
              <span>{t.hero.dateDisplay}</span>
              <span className="text-[#B89158]" aria-hidden="true">·</span>
              <span>{t.hero.locationDisplay}</span>
              {settings.villageName && (
                <>
                  <span className="text-[#B89158]" aria-hidden="true">·</span>
                  <span>{settings.villageName}</span>
                </>
              )}
            </motion.div>

            {/* Compte à rebours élégant en haut de la page d'accueil */}
            <HeroCountdownBadge />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.62 }}
              className="text-sm sm:text-lg text-white font-normal leading-relaxed max-w-2xl mx-auto mb-9 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              {t.hero.lead}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.72 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4"
            >
              <a
                href="#confirmation"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#B89158] text-[#101D35] text-sm font-semibold tracking-wide hover:bg-[#c9a369] transition-transform duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0 shadow-lg"
              >
                {t.hero.primaryCta}
              </a>
              <a
                href="#programme"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/70 text-white bg-black/35 hover:bg-black/55 text-sm font-medium tracking-wide transition-transform duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
              >
                {t.hero.secondaryCta}
              </a>
            </motion.div>

            <div className="mt-8 flex items-center justify-center">
              <button
                type="button"
                onClick={handleShareInvitation}
                className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-[#B89158] transition-colors cursor-pointer drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#B89158]" />
                    <span>{t.hero.linkCopied}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t.hero.shareBtn}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bandeau Compte à rebours cohérent */}
      <ScrollReveal>
        <CountdownStrip />
      </ScrollReveal>

      {/* =====================================================================
          SECTION 2 : NOTRE UNION ET NOS FAMILLES
      ===================================================================== */}
      <section
        id="notre-union"
        className="py-20 lg:py-28 bg-[#FBF8F1] overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-3">
              {t.union.kicker}
            </p>
            <h2
              className="text-3xl sm:text-5xl text-[#101D35] font-semibold tracking-tight mb-6"
              style={{ textWrap: 'balance' }}
            >
              {t.union.title}
            </h2>
            <p className="text-base sm:text-lg text-[#19263B]/85 leading-relaxed">
              {t.union.text}
            </p>
          </ScrollReveal>

          <NdopMotifFrieze variant="dark" className="mb-16" />

          {/* Mise en page éditoriale avec le carrousel tactile à lecture automatique */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
            <ScrollReveal direction="left" className="lg:col-span-6">
              <UnionPhotoCarousel />
            </ScrollReveal>

            <div className="lg:col-span-6 space-y-8">
              {[
                {
                  num: '01',
                  title: t.union.pillars.hospitalityTitle,
                  text: t.union.pillars.hospitalityText,
                },
                {
                  num: '02',
                  title: t.union.pillars.traditionTitle,
                  text: t.union.pillars.traditionText,
                },
                {
                  num: '03',
                  title: t.union.pillars.transmissionTitle,
                  text: t.union.pillars.transmissionText,
                },
              ].map((pillar, idx) => (
                <ScrollReveal
                  key={pillar.num}
                  direction="right"
                  delay={idx * 0.12}
                  className={idx < 2 ? 'border-b border-[#183153]/15 pb-6' : ''}
                >
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#183153] mb-2">
                    <span className="text-[#B89158] mr-2">{pillar.num}.</span>
                    {pillar.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#19263B]/80 leading-relaxed">
                    {pillar.text}
                  </p>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Emplacements facultatifs : masqués proprement tant qu'ils ne sont pas renseignés */}
          {(coupleWord ||
            coupleStory ||
            (settings.parentsNames && settings.parentsNames.length > 0) ||
            settings.groomFamilyPhotoUrl ||
            settings.brideFamilyPhotoUrl) && (
            <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#183153]/15">
              {coupleWord && (
                <div className="bg-white border border-[#183153]/15 p-8">
                  <h3 className="text-xl font-semibold text-[#183153] mb-3">
                    {t.union.coupleWordTitle}
                  </h3>
                  <p className="text-[#19263B]/85 leading-relaxed italic text-base sm:text-lg">
                    « {coupleWord} »
                  </p>
                </div>
              )}

              {coupleStory && (
                <div className="bg-white border border-[#183153]/15 p-8">
                  <h3 className="text-xl font-semibold text-[#183153] mb-3">
                    {t.union.storyTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-[#19263B]/85 leading-relaxed">
                    {coupleStory}
                  </p>
                </div>
              )}

              {settings.parentsNames && settings.parentsNames.length > 0 && (
                <div className="bg-white border border-[#183153]/15 p-8 md:col-span-2 text-center">
                  <h3 className="text-xl font-semibold text-[#183153] mb-4">
                    {t.union.parentsTitle}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-6 text-base font-medium text-[#19263B]">
                    {settings.parentsNames.map((parentName, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-[#B89158]">·</span>}
                        <span>{parentName}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {(settings.groomFamilyPhotoUrl || settings.brideFamilyPhotoUrl) && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {settings.groomFamilyPhotoUrl && (
                    <div className="border border-[#183153]/15 bg-white p-3">
                      <img
                        src={settings.groomFamilyPhotoUrl}
                        alt={settings.groomName}
                        referrerPolicy="no-referrer"
                        className="w-full h-72 object-cover"
                      />
                    </div>
                  )}
                  {settings.brideFamilyPhotoUrl && (
                    <div className="border border-[#183153]/15 bg-white p-3">
                      <img
                        src={settings.brideFamilyPhotoUrl}
                        alt={settings.brideName}
                        referrerPolicy="no-referrer"
                        className="w-full h-72 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* =====================================================================
          SECTION 3 : PROGRAMME DE LA CÉRÉMONIE (Timeline en 5 étapes)
      ===================================================================== */}
      <section
        id="programme"
        className="py-20 lg:py-28 bg-[#101D35] text-[#FBF8F1]"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#B89158] mb-3">
              {t.program.kicker}
            </p>
            <h2
              className="text-3xl sm:text-5xl text-[#FBF8F1] font-semibold tracking-tight mb-5"
              style={{ textWrap: 'balance' }}
            >
              {t.program.title}
            </h2>
            <p className="text-sm sm:text-base text-[#E8EEF6]/80 leading-relaxed mb-6">
              {t.program.contextDisclaimer}
            </p>
            <div className="inline-block border border-[#B89158]/40 bg-[#183153]/70 px-5 py-2.5 text-xs sm:text-sm text-[#FBF8F1]">
              {settings.eventStartTime
                ? `${locale === 'fr' ? 'Début prévu à' : 'Scheduled start:'} ${settings.eventStartTime} (Africa/Douala)`
                : t.program.scheduleNotice}
            </div>
          </ScrollReveal>

          <NdopMotifFrieze variant="light" className="mb-14" />

          {/* Timeline verticale des 5 étapes */}
          <div className="space-y-5">
            {t.program.steps.map((step, index) => {
              const isOpen = Boolean(openSteps[index]);
              return (
                <ScrollReveal
                  key={step.number}
                  delay={index * 0.08}
                  className="border border-[#FBF8F1]/15 bg-[#183153]/55 hover:border-[#B89158]/50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    aria-expanded={isOpen}
                    className="w-full text-left p-6 sm:p-8 flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                      <span className="text-xs sm:text-sm font-semibold text-[#B89158] tabular-nums shrink-0 tracking-wider">
                        ÉTAPE {step.number}
                      </span>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold text-[#FBF8F1] mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm sm:text-base text-[#E8EEF6]/80">
                          {step.summary}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs text-[#B89158] shrink-0 mt-1">
                      <span className="hidden sm:inline">
                        {isOpen ? t.program.collapseDetails : t.program.expandDetails}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 sm:px-8 pb-7 pt-2 border-t border-[#FBF8F1]/10 sm:pl-28 space-y-2.5">
                          <ul className="space-y-2 text-sm sm:text-base text-[#E8EEF6]/90 list-disc pl-5">
                            {step.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="leading-relaxed">
                                {bullet}
                              </li>
                            ))}
                            {index === 3 && symbolicNote && (
                              <li className="leading-relaxed text-[#B89158]">
                                {symbolicNote}
                              </li>
                            )}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4 : INFORMATIONS PRATIQUES & AGENDA .ICS
      ===================================================================== */}
      <section
        id="informations-pratiques"
        className="py-20 lg:py-28 bg-[#FBF8F1]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl mb-14">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-3">
              {t.practical.kicker}
            </p>
            <h2
              className="text-3xl sm:text-5xl text-[#101D35] font-semibold tracking-tight mb-4"
              style={{ textWrap: 'balance' }}
            >
              {t.practical.title}
            </h2>
            <p className="text-base text-[#19263B]/80 leading-relaxed">
              {t.practical.subtitle}
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Grille des repères confirmés */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ScrollReveal className="bg-white border border-[#183153]/15 p-6 sm:p-8">
                <p className="text-xs uppercase tracking-wider text-[#315783] mb-2">
                  {t.practical.dateLabel}
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-[#101D35] mb-1">
                  {t.practical.dateValue}
                </p>
                <p className="text-sm text-[#19263B]/75">
                  {t.practical.timeLabel} :{' '}
                  <span className="font-medium text-[#183153]">
                    {settings.eventStartTime
                      ? `${settings.eventStartTime}${settings.eventEndTime ? ` – ${settings.eventEndTime}` : ''} (${settings.timeZone})`
                      : t.practical.timePending}
                  </span>
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.08} className="bg-white border border-[#183153]/15 p-6 sm:p-8">
                <p className="text-xs uppercase tracking-wider text-[#315783] mb-2">
                  {t.practical.localityLabel}
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-[#101D35] mb-1">
                  {settings.city}, {settings.region}
                </p>
                <p className="text-sm text-[#19263B]/75">
                  {t.practical.settingLabel} :{' '}
                  <span className="font-medium text-[#183153]">
                    {settings.villageName || t.practical.settingValue}
                  </span>
                </p>
              </ScrollReveal>

              <ScrollReveal
                delay={0.15}
                className="bg-white border border-[#183153]/15 p-6 sm:p-8 sm:col-span-2"
              >
                <p className="text-xs uppercase tracking-wider text-[#315783] mb-2">
                  {t.practical.villageLabel} &amp; {t.practical.addressLabel}
                </p>
                <p className="text-lg sm:text-xl font-semibold text-[#101D35] mb-2">
                  {settings.villageName
                    ? `${settings.villageName}${settings.venueName ? ` · ${settings.venueName}` : ''}`
                    : t.practical.villagePending}
                </p>
                <p className="text-sm text-[#19263B]/80 leading-relaxed">
                  {settings.address || settings.directions
                    ? `${settings.address ? settings.address + '. ' : ''}${settings.directions || ''}`
                    : t.practical.addressPending}
                </p>
              </ScrollReveal>

              {/* Carte interactive pointant vers Bangangté avec épingle personnalisée R & J */}
              <ScrollReveal delay={0.2} className="sm:col-span-2">
                <BangangteMap />
              </ScrollReveal>

              {/* Dress code uniquement s'il est défini */}
              {settings.dressCode && (
                <ScrollReveal className="bg-white border border-[#183153]/15 p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-wider text-[#315783] mb-2">
                    {t.practical.dressCodeLabel}
                  </p>
                  <p className="text-sm sm:text-base text-[#19263B]/85 leading-relaxed">
                    {settings.dressCode}
                  </p>
                </ScrollReveal>
              )}

              {/* Stationnement uniquement s'il est défini */}
              {settings.parkingInfo && (
                <ScrollReveal className="bg-white border border-[#183153]/15 p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-wider text-[#315783] mb-2">
                    {t.practical.parkingLabel}
                  </p>
                  <p className="text-sm sm:text-base text-[#19263B]/85 leading-relaxed">
                    {settings.parkingInfo}
                  </p>
                </ScrollReveal>
              )}

              {/* Hébergement uniquement s'il est fourni */}
              {settings.accommodationInfo && (
                <ScrollReveal className="bg-white border border-[#183153]/15 p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-wider text-[#315783] mb-2">
                    {t.practical.accommodationLabel}
                  </p>
                  <p className="text-sm sm:text-base text-[#19263B]/85 leading-relaxed">
                    {settings.accommodationInfo}
                  </p>
                </ScrollReveal>
              )}

              {/* Accessibilité uniquement si connue */}
              {settings.accessibilityInfo && (
                <ScrollReveal className="bg-white border border-[#183153]/15 p-6 sm:p-8">
                  <p className="text-xs uppercase tracking-wider text-[#315783] mb-2">
                    {t.practical.accessibilityLabel}
                  </p>
                  <p className="text-sm sm:text-base text-[#19263B]/85 leading-relaxed">
                    {settings.accessibilityInfo}
                  </p>
                </ScrollReveal>
              )}
            </div>

            {/* Colonne d'actions : Agenda .ics, Contact du jour & Itinéraire */}
            <ScrollReveal
              direction="right"
              delay={0.15}
              className="lg:col-span-4 bg-[#183153] text-[#FBF8F1] p-7 sm:p-9 space-y-6 border border-[#101D35]"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-[#B89158] mb-2">
                  {t.practical.contactLabel}
                </p>
                <p className="text-lg font-semibold text-[#FBF8F1] tabular-nums mb-1">
                  {settings.whatsappDisplayNumber}
                </p>
                <p className="text-xs text-[#E8EEF6]/75">
                  WhatsApp · {settings.groomName} &amp; {settings.brideName}
                </p>
              </div>

              <div className="pt-4 border-t border-[#FBF8F1]/15 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadWeddingIcs({
                      groomName: settings.groomName,
                      brideName: settings.brideName,
                      eventDate: settings.eventDate,
                      eventStartTime: settings.eventStartTime,
                      eventEndTime: settings.eventEndTime,
                      city: settings.city,
                      region: settings.region,
                      villageName: settings.villageName,
                      address: settings.address,
                      locale,
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#B89158] text-[#101D35] font-semibold text-xs sm:text-sm tracking-wide hover:bg-[#c9a369] transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 shrink-0" />
                  <span>{t.practical.addToCalendarBtn}</span>
                </button>

                {!settings.eventStartTime && (
                  <p className="text-xs text-[#E8EEF6]/75 leading-relaxed">
                    {t.practical.calendarNote}
                  </p>
                )}

                {/* Bouton Ouvrir l'itinéraire : uniquement si mapsUrl exact est configuré */}
                {settings.mapsUrl && (
                  <a
                    href={settings.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 border border-[#FBF8F1]/30 text-[#FBF8F1] hover:bg-[#FBF8F1]/10 text-xs sm:text-sm font-medium transition-colors"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{t.practical.openDirectionsBtn}</span>
                  </a>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5 : CONFIRMATION DE PRÉSENCE PAR WHATSAPP & MOT AUX MARIÉS
      ===================================================================== */}
      <section
        id="confirmation"
        className="py-20 lg:py-28 bg-[#E8EEF6]/65 border-y border-[#183153]/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Formulaire principal RSVP */}
            <ScrollReveal className="lg:col-span-7 bg-white border border-[#183153]/15 p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-2">
                {t.rsvp.kicker}
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#101D35] mb-3">
                {t.rsvp.title}
              </h2>
              <p className="text-sm sm:text-base text-[#19263B]/80 mb-8 leading-relaxed">
                {t.rsvp.subtitle}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  validateRsvp();
                }}
                noValidate
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="rsvp-firstname"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                    >
                      {t.rsvp.firstName} *
                    </label>
                    <input
                      id="rsvp-firstname"
                      type="text"
                      value={rsvpFirstName}
                      onChange={(e) => {
                        setRsvpFirstName(e.target.value);
                        if (rsvpErrors.firstName) setRsvpErrors({ ...rsvpErrors, firstName: undefined });
                      }}
                      className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-[#19263B] text-sm focus:outline-none focus:border-[#183153]"
                    />
                    {rsvpErrors.firstName && (
                      <p className="mt-1.5 text-xs text-red-700" role="alert">
                        {rsvpErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="rsvp-lastname"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                    >
                      {t.rsvp.lastName} *
                    </label>
                    <input
                      id="rsvp-lastname"
                      type="text"
                      value={rsvpLastName}
                      onChange={(e) => {
                        setRsvpLastName(e.target.value);
                        if (rsvpErrors.lastName) setRsvpErrors({ ...rsvpErrors, lastName: undefined });
                      }}
                      className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-[#19263B] text-sm focus:outline-none focus:border-[#183153]"
                    />
                    {rsvpErrors.lastName && (
                      <p className="mt-1.5 text-xs text-red-700" role="alert">
                        {rsvpErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Choix de présence : Oui / Non / Peut-être */}
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2.5">
                    {t.rsvp.attendance} *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['yes', 'no', 'maybe'] as const).map((option) => {
                      const label =
                        option === 'yes'
                          ? t.rsvp.attendanceYes
                          : option === 'no'
                          ? t.rsvp.attendanceNo
                          : t.rsvp.attendanceMaybe;
                      const active = rsvpAttendance === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setRsvpAttendance(option)}
                          aria-pressed={active}
                          className={`px-4 py-3 text-xs sm:text-sm font-medium border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#183153] text-[#FBF8F1] border-[#183153]'
                              : 'bg-[#FBF8F1]/60 text-[#19263B] border-[#183153]/20 hover:border-[#183153]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accompagnants adultes & enfants */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="rsvp-adults"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                    >
                      {t.rsvp.adultsCount}
                    </label>
                    <input
                      id="rsvp-adults"
                      type="number"
                      min="0"
                      max="20"
                      value={rsvpAdults}
                      onChange={(e) => setRsvpAdults(e.target.value)}
                      className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-[#19263B] text-sm tabular-nums focus:outline-none focus:border-[#183153]"
                    />
                    {rsvpErrors.adults && (
                      <p className="mt-1.5 text-xs text-red-700" role="alert">
                        {rsvpErrors.adults}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="rsvp-children"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                    >
                      {t.rsvp.childrenCount}
                    </label>
                    <input
                      id="rsvp-children"
                      type="number"
                      min="0"
                      max="20"
                      value={rsvpChildren}
                      onChange={(e) => setRsvpChildren(e.target.value)}
                      className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-[#19263B] text-sm tabular-nums focus:outline-none focus:border-[#183153]"
                    />
                    {rsvpErrors.children && (
                      <p className="mt-1.5 text-xs text-red-700" role="alert">
                        {rsvpErrors.children}
                      </p>
                    )}
                  </div>
                </div>

                {/* Champs facultatifs */}
                <div>
                  <label
                    htmlFor="rsvp-travel"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                  >
                    {t.rsvp.travelInfo}
                  </label>
                  <input
                    id="rsvp-travel"
                    type="text"
                    value={rsvpTravel}
                    onChange={(e) => setRsvpTravel(e.target.value)}
                    placeholder={t.rsvp.travelPlaceholder}
                    className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-[#19263B] text-sm focus:outline-none focus:border-[#183153]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rsvp-dietary"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                  >
                    {t.rsvp.dietary}
                  </label>
                  <input
                    id="rsvp-dietary"
                    type="text"
                    value={rsvpDietary}
                    onChange={(e) => setRsvpDietary(e.target.value)}
                    placeholder={t.rsvp.dietaryPlaceholder}
                    className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-[#19263B] text-sm focus:outline-none focus:border-[#183153]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rsvp-message"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                  >
                    {t.rsvp.message}
                  </label>
                  <textarea
                    id="rsvp-message"
                    rows={3}
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    placeholder={t.rsvp.messagePlaceholder}
                    className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-[#19263B] text-sm focus:outline-none focus:border-[#183153]"
                  />
                </div>

                {/* Avertissement honnête et boutons WhatsApp + Copie de secours */}
                <div className="pt-2 space-y-4">
                  <p className="text-xs text-[#19263B]/75 bg-[#FBF8F1] p-3.5 border border-[#183153]/15 leading-relaxed">
                    {t.rsvp.disclaimer} ({t.rsvp.organizationContactLabel} :{' '}
                    <span className="tabular-nums font-medium">{settings.whatsappDisplayNumber}</span>)
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href={getRsvpWhatsappHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!validateRsvp()) {
                          e.preventDefault();
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[#183153] text-[#FBF8F1] text-sm font-medium tracking-wide hover:bg-[#101D35] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>{t.rsvp.submitWhatsapp}</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleRsvpCopyFallback}
                      className="inline-flex items-center justify-center gap-2 px-5 py-4 border border-[#183153]/30 text-[#183153] text-xs font-medium hover:bg-[#E8EEF6]/60 transition-colors cursor-pointer"
                    >
                      {rsvpCopied ? (
                        <>
                          <Check className="w-4 h-4 text-[#B89158]" />
                          <span>{t.rsvp.copiedSuccess}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{t.rsvp.copyFallback}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </ScrollReveal>

            {/* Colonne Droite : Message personnel aux mariés & Portrait */}
            <ScrollReveal delay={0.15} className="lg:col-span-5 space-y-8">
              <div className="bg-[#101D35] text-[#FBF8F1] p-7 sm:p-10 border border-[#183153]">
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#B89158] mb-2">
                  {t.coupleMessage.kicker}
                </p>
                <h3 className="text-2xl sm:text-3xl font-semibold text-[#FBF8F1] mb-3">
                  {t.coupleMessage.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#E8EEF6]/80 mb-6 leading-relaxed">
                  {t.coupleMessage.subtitle}
                </p>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="wish-name"
                      className="block text-xs uppercase tracking-wider text-[#E8EEF6]/90 mb-1.5"
                    >
                      {t.coupleMessage.firstName} *
                    </label>
                    <input
                      id="wish-name"
                      type="text"
                      value={wishName}
                      onChange={(e) => {
                        setWishName(e.target.value);
                        if (wishError) setWishError('');
                      }}
                      className="w-full px-4 py-2.5 bg-[#183153]/70 border border-[#FBF8F1]/20 text-[#FBF8F1] text-sm focus:outline-none focus:border-[#B89158]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="wish-text"
                      className="block text-xs uppercase tracking-wider text-[#E8EEF6]/90 mb-1.5"
                    >
                      {t.coupleMessage.message} *
                    </label>
                    <textarea
                      id="wish-text"
                      rows={3}
                      value={wishText}
                      onChange={(e) => {
                        setWishText(e.target.value);
                        if (wishError) setWishError('');
                      }}
                      placeholder={t.coupleMessage.placeholder}
                      className="w-full px-4 py-2.5 bg-[#183153]/70 border border-[#FBF8F1]/20 text-[#FBF8F1] text-sm focus:outline-none focus:border-[#B89158]"
                    />
                  </div>

                  {wishError && (
                    <p className="text-xs text-[#B89158]" role="alert">
                      {wishError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href={getCoupleWishHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!wishName.trim() || !wishText.trim()) {
                          e.preventDefault();
                          setWishError(t.coupleMessage.errorRequired);
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#B89158] text-[#101D35] text-xs font-semibold tracking-wide hover:bg-[#c9a369] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>{t.coupleMessage.sendBtn}</span>
                    </a>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!wishName.trim() || !wishText.trim()) {
                          setWishError(t.coupleMessage.errorRequired);
                          return;
                        }
                        try {
                          await navigator.clipboard.writeText(buildCoupleWishMessage());
                          setWishCopied(true);
                          setTimeout(() => setWishCopied(false), 3000);
                        } catch {}
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-[#FBF8F1]/25 text-[#FBF8F1] text-xs hover:bg-[#FBF8F1]/10 transition-colors cursor-pointer"
                    >
                      {wishCopied ? <Check className="w-3.5 h-3.5 text-[#B89158]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{t.coupleMessage.copyBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-[#183153]/15 bg-white p-3">
                <div className="aspect-[4/3] overflow-hidden bg-[#183153]">
                  <img
                    src="/assets/aistudio/267471665367741484_b9b446cc.jpg"
                    alt={`${settings.groomName} & ${settings.brideName}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6 : APERÇU DE LA GALERIE PARTICIPATIVE (SOUVENIRS)
      ===================================================================== */}
      <section
        id="souvenirs"
        className="py-20 lg:py-28 bg-[#FBF8F1]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-3">
                {t.gallery.kicker}
              </p>
              <h2
                className="text-3xl sm:text-5xl text-[#101D35] font-semibold tracking-tight mb-4"
                style={{ textWrap: 'balance' }}
              >
                {isAfterEvent ? t.gallery.titleAfter : t.gallery.titleBefore}
              </h2>
              <p className="text-base text-[#19263B]/80 leading-relaxed">
                {t.gallery.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Link
                to="/partager-des-photos"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#183153] text-[#FBF8F1] text-xs sm:text-sm font-medium hover:bg-[#101D35] transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{t.gallery.shareBtn}</span>
              </Link>
              <Link
                to="/souvenirs"
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-[#183153]/30 text-[#183153] text-xs sm:text-sm font-medium hover:bg-[#E8EEF6]/60 transition-colors"
              >
                <span>{t.gallery.viewAllBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>

          {/* Grille éditoriale des photos officielles et partagées */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewPhotos.slice(0, 3).map((photo, idx) => (
              <ScrollReveal key={photo._id} delay={idx * 0.1}>
                <Link
                  to="/souvenirs"
                  className="group block bg-white border border-[#183153]/15 p-3 transition-colors hover:border-[#183153]/40"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-[#101D35] mb-3">
                    <img
                      src={photo.url}
                      alt={photo.caption || `${settings.groomName} & ${settings.brideName}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  {photo.caption && (
                    <p className="text-xs text-[#19263B]/80 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 7 : COMPOSANT FAQ DÉDIÉ
      ===================================================================== */}
      <FAQ />
    </div>
  );
};
