import React from 'react';
import { useWedding } from '../context/WeddingContext';
import { NdopMotifFrieze } from '../components/NdopMotif';
import { MessageCircle, Shield } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const { t, locale, settings } = useWedding();

  const getRemovalWhatsappHref = () => {
    const cleanPhone = (settings.whatsappNumber || '33753049353').replace(/[^\d]/g, '');
    const msg =
      locale === 'fr'
        ? `Bonjour, je souhaite demander le retrait ou la modification d'une photographie publiée dans l'album du mariage de ${settings.groomName} et ${settings.brideName}.`
        : `Hello, I would like to request the removal or modification of a photo in the wedding album of ${settings.groomName} and ${settings.brideName}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#183153]/15 p-7 sm:p-12">
          <div className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-3">
            <Shield className="w-4 h-4 text-[#B89158]" />
            <span>{t.privacy.kicker}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl text-[#101D35] font-normal mb-4">
            {t.privacy.title}
          </h1>

          <p className="text-base text-[#19263B]/85 leading-relaxed mb-8">
            {t.privacy.intro}
          </p>

          <NdopMotifFrieze variant="dark" className="mb-10" />

          <div className="space-y-8">
            {t.privacy.sections.map((sec, idx) => (
              <div key={idx} className="border-b border-[#183153]/10 pb-6 last:border-b-0">
                <h2 className="font-serif text-2xl text-[#183153] mb-2">
                  {sec.title}
                </h2>
                <p className="text-sm sm:text-base text-[#19263B]/80 leading-relaxed">
                  {sec.body}
                </p>
              </div>
            ))}

            <div className="pt-4 border-t border-[#183153]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-[#19263B]/75">
                {locale === 'fr'
                  ? `Durée de conservation configurée : ${settings.retentionMonths} mois.`
                  : `Configured retention period: ${settings.retentionMonths} months.`}
              </div>

              <a
                href={getRemovalWhatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#183153] text-[#FBF8F1] text-xs font-medium hover:bg-[#101D35] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t.privacy.requestRemovalBtn}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
