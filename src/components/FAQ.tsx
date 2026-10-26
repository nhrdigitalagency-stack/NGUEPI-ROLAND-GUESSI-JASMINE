import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MapPin, Camera, MessageCircle, HelpCircle } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { NdopMotifFrieze } from './NdopMotif';

export const FAQ: React.FC = () => {
  const { t, locale, settings } = useWedding();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const getFaqAnswer = (item: { q: string; a?: string; aDynamic?: string }): string => {
    if (item.a) return item.a;
    if (item.aDynamic === 'venue') {
      if (settings.villageName && settings.address) {
        return locale === 'fr'
          ? `La cérémonie se déroule dans le village de la mariée (${settings.villageName}) à ${settings.city} (${settings.address}).`
          : `The ceremony takes place in the bride’s family village (${settings.villageName}) in ${settings.city} (${settings.address}).`;
      }
      return locale === 'fr'
        ? `La cérémonie aura lieu dans le village de la mariée à ${settings.city}, dans la région de l’${settings.region} au Cameroun. Le nom exact du village et les repères précis seront communiqués très prochainement sur cette page.`
        : `The ceremony will take place in the bride’s family village in ${settings.city} (${settings.region} Region, Cameroon). The exact village name and landmarks will be updated here soon.`;
    }
    if (item.aDynamic === 'time') {
      if (settings.eventStartTime) {
        return locale === 'fr'
          ? `L’accueil débute à ${settings.eventStartTime} (heure du Cameroun, Africa/Douala).`
          : `Welcoming begins at ${settings.eventStartTime} (Cameroon time, Africa/Douala).`;
      }
      return locale === 'fr'
        ? `Les horaires détaillés seront précisés prochainement par les deux familles.`
        : `Detailed timings will be announced soon by both families.`;
    }
    if (item.aDynamic === 'dressCode') {
      if (settings.dressCode) {
        return settings.dressCode;
      }
      return locale === 'fr'
        ? `Aucune tenue imposée n’est définie à ce stade. Les tenues traditionnelles (notamment d’inspiration Ndop ou indigo) et les tenues de ville élégantes sont les bienvenues.`
        : `No strict dress code has been set at this stage. Traditional attire (especially Ndop or indigo-inspired outfits) and elegant formal wear are warmly welcomed.`;
    }
    if (item.aDynamic === 'directions') {
      if (settings.directions) {
        return settings.directions;
      }
      return locale === 'fr'
        ? `Les repères routiers détaillés depuis le centre de Bangangté vers le village de la mariée seront publiés ici dès leur confirmation. Vous pouvez également demander des précisions dans le formulaire de confirmation.`
        : `Detailed road landmarks from central Bangangté to the bride’s village will be published here once confirmed. You may also request route guidance in the RSVP form.`;
    }
    return '';
  };

  return (
    <section
      id="faq"
      className="py-20 lg:py-28 bg-white border-t border-[#183153]/10 relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-3">
            {t.faq.kicker}
          </p>
          <h2
            className="text-3xl sm:text-5xl text-[#101D35] font-semibold tracking-tight mb-6"
            style={{ textWrap: 'balance' }}
          >
            {t.faq.title}
          </h2>
          <NdopMotifFrieze variant="dark" className="mt-4" />
        </motion.div>

        <div className="divide-y divide-[#183153]/15 border-y border-[#183153]/15">
          {t.faq.items.map((item, idx) => {
            const isOpen = openIndex === idx;
            const isPhotoQuestion = idx === 6;
            const isDirectionsQuestion = idx === 0 || idx === 5;
            const isContactQuestion = idx === 7;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="py-4 sm:py-5"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left py-2 cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#183153]"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-xs font-semibold text-[#B89158] tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-base sm:text-xl font-medium text-[#101D35] group-hover:text-[#315783] transition-colors">
                      {item.q}
                    </span>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-8 h-8 flex items-center justify-center border shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-[#183153] text-[#FBF8F1] border-[#183153]'
                        : 'border-[#183153]/20 text-[#183153] group-hover:border-[#183153]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.span>
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
                      <div className="pt-3 pb-2 pl-7 sm:pl-9 pr-4 space-y-4">
                        <p className="text-sm sm:text-base text-[#19263B]/80 leading-relaxed">
                          {getFaqAnswer(item)}
                        </p>

                        {/* Actions directes contextuelles selon la question */}
                        {isPhotoQuestion && (
                          <div className="pt-1">
                            <Link
                              to="/partager-des-photos"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#183153] text-[#FBF8F1] text-xs font-medium hover:bg-[#101D35] transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>{t.gallery.shareBtn}</span>
                            </Link>
                          </div>
                        )}

                        {isDirectionsQuestion && settings.mapsUrl && (
                          <div className="pt-1">
                            <a
                              href={settings.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 border border-[#183153]/30 text-[#183153] text-xs font-medium hover:bg-[#E8EEF6]/60 transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{t.practical.openDirectionsBtn}</span>
                            </a>
                          </div>
                        )}

                        {isContactQuestion && (
                          <div className="pt-1">
                            <a
                              href={`https://wa.me/${settings.whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#B89158] text-[#101D35] text-xs font-medium hover:bg-[#c9a369] transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp : {settings.whatsappDisplayNumber}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bandeau d'assistance rapide en bas de FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 p-6 bg-[#FBF8F1] border border-[#183153]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[#B89158] shrink-0" />
            <p className="text-xs sm:text-sm text-[#19263B]/85">
              {locale === 'fr'
                ? 'Une autre question concernant votre venue à Bangangté ?'
                : 'Have another question about your trip to Bangangté?'}
            </p>
          </div>
          <a
            href="#confirmation"
            className="text-xs font-semibold text-[#183153] hover:text-[#315783] underline underline-offset-4 whitespace-nowrap"
          >
            {t.nav.rsvp}
          </a>
        </motion.div>
      </div>
    </section>
  );
};
