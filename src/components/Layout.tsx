import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { MonogramRJ } from './NdopMotif';

export const Header: React.FC = () => {
  const { t, locale, setLocale } = useWedding();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        scrolled
          ? 'bg-[#FBF8F1]/95 backdrop-blur-md border-b border-[#183153]/10'
          : 'bg-[#FBF8F1] border-b border-[#183153]/10'
      }`}
    >
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand / Monogramme R & J */}
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center gap-3 text-[#183153] focus-visible:outline-2 focus-visible:outline-[#183153] whitespace-nowrap shrink-0"
          aria-label="Nguepi Roland & Guessi Jasmine — Accueil"
        >
          <MonogramRJ size="sm" variant="indigo" />
          <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-[#183153]">
            Roland <span className="text-[#B89158] italic font-normal">&amp;</span> Jasmine
          </span>
        </Link>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#19263B]/80"
          aria-label="Navigation principale"
        >
          <button
            type="button"
            onClick={() => scrollToSection('notre-union')}
            className="hover:text-[#183153] py-1 border-b border-transparent hover:border-[#B89158] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.union}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('programme')}
            className="hover:text-[#183153] py-1 border-b border-transparent hover:border-[#B89158] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.program}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('informations-pratiques')}
            className="hover:text-[#183153] py-1 border-b border-transparent hover:border-[#B89158] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.practical}
          </button>
          <Link
            to="/souvenirs"
            className={`py-1 border-b transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/souvenirs' || location.pathname === '/partager-des-photos'
                ? 'text-[#183153] border-[#B89158] font-semibold'
                : 'border-transparent hover:text-[#183153] hover:border-[#B89158]'
            }`}
          >
            {t.nav.memories}
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection('faq')}
            className="hover:text-[#183153] py-1 border-b border-transparent hover:border-[#B89158] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.faq}
          </button>
        </nav>

        {/* Zone 3: Language Switcher & Primary CTA */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Sélecteur FR / EN discret */}
          <div
            className="inline-flex items-center border border-[#183153]/20 bg-white/80 p-0.5 text-xs font-medium"
            role="group"
            aria-label="Sélecteur de langue / Language selector"
          >
            <button
              type="button"
              onClick={() => setLocale('fr')}
              aria-pressed={locale === 'fr'}
              className={`px-2.5 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                locale === 'fr'
                  ? 'bg-[#183153] text-[#FBF8F1]'
                  : 'text-[#19263B]/70 hover:text-[#183153]'
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              aria-pressed={locale === 'en'}
              className={`px-2.5 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                locale === 'en'
                  ? 'bg-[#183153] text-[#FBF8F1]'
                  : 'text-[#19263B]/70 hover:text-[#183153]'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => scrollToSection('confirmation')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2.5 text-xs font-medium tracking-wide bg-[#183153] text-[#FBF8F1] hover:bg-[#101D35] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.rsvp}
          </button>

          {/* Bouton Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 text-[#183153] border border-[#183153]/20 hover:bg-[#E8EEF6]/50 transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FBF8F1] border-b border-[#183153]/15 px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <button
            type="button"
            onClick={() => scrollToSection('notre-union')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#19263B] hover:bg-[#E8EEF6]/60"
          >
            {t.nav.union}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('programme')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#19263B] hover:bg-[#E8EEF6]/60"
          >
            {t.nav.program}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('informations-pratiques')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#19263B] hover:bg-[#E8EEF6]/60"
          >
            {t.nav.practical}
          </button>
          <Link
            to="/souvenirs"
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#19263B] hover:bg-[#E8EEF6]/60"
          >
            {t.nav.memories}
          </Link>
          <Link
            to="/partager-des-photos"
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#19263B] hover:bg-[#E8EEF6]/60"
          >
            {t.nav.sharePhotos}
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection('faq')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#19263B] hover:bg-[#E8EEF6]/60"
          >
            {t.nav.faq}
          </button>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => scrollToSection('confirmation')}
              className="w-full py-3 text-center text-xs font-medium tracking-wide bg-[#183153] text-[#FBF8F1] hover:bg-[#101D35]"
            >
              {t.nav.rsvp}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC = () => {
  const { t, settings } = useWedding();

  return (
    <footer className="bg-[#101D35] text-[#FBF8F1] border-t border-[#B89158]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#FBF8F1]/10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <MonogramRJ size="sm" variant="ivory" />
              <span className="font-serif text-2xl sm:text-3xl tracking-wide text-[#FBF8F1]">
                {settings.groomName} <span className="text-[#B89158] italic">&amp;</span> {settings.brideName}
              </span>
            </div>
            <p className="font-serif italic text-lg text-[#E8EEF6]/85">
              « {t.footer.signature} »
            </p>
            <p className="text-xs text-[#E8EEF6]/65 tracking-wide">
              {t.footer.dateLocation}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-sm">
            <div>
              <p className="text-xs text-[#B89158] mb-1">
                {t.footer.organizationContact}
              </p>
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FBF8F1] hover:text-[#B89158] transition-colors font-mono tabular-nums"
              >
                WhatsApp : {settings.whatsappDisplayNumber}
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E8EEF6]/65">
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="hover:text-[#FBF8F1] transition-colors">
              {t.nav.home}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/souvenirs" className="hover:text-[#FBF8F1] transition-colors">
              {t.nav.memories}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/partager-des-photos" className="hover:text-[#FBF8F1] transition-colors">
              {t.nav.sharePhotos}
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/confidentialite" className="hover:text-[#FBF8F1] transition-colors">
              {t.footer.privacyLink}
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              to="/admin"
              className="text-[#B89158] hover:text-[#FBF8F1] transition-colors font-medium underline underline-offset-4"
            >
              {t.footer.managePageLink}
            </Link>
          </div>

          <p className="text-[#E8EEF6]/50">
            {settings.groomName} &amp; {settings.brideName} · 2026
          </p>
        </div>
      </div>
    </footer>
  );
};
