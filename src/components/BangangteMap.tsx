import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Compass } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

// Coordonnées de Bangangté, Région de l'Ouest, Cameroun
const BANGANGTE_COORDS: [number, number] = [5.1408, 10.5236];

export const BangangteMap: React.FC = () => {
  const { locale, settings } = useWedding();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: BANGANGTE_COORDS,
      zoom: 13,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Épingle personnalisée aux couleurs Ndop (Indigo #101D35 & Bronze #B89158) avec monogramme R & J
    const customPinHtml = `
      <div style="position: relative; width: 48px; height: 60px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 6px 12px rgba(16, 29, 53, 0.45));">
        <div style="width: 44px; height: 44px; background: #101D35; border: 2px solid #B89158; display: flex; align-items: center; justify-content: center; transform: rotate(45deg); border-radius: 6px;">
          <span style="transform: rotate(-45deg); color: #FBF8F1; font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.04em;">
            R<span style="color: #B89158;">&amp;</span>J
          </span>
        </div>
        <div style="width: 3px; height: 14px; background: #B89158; margin-top: -2px;"></div>
        <div style="width: 10px; height: 4px; border-radius: 9999px; background: rgba(16, 29, 53, 0.45);"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: customPinHtml,
      className: 'custom-rj-leaflet-pin',
      iconSize: [48, 60],
      iconAnchor: [24, 58],
      popupAnchor: [0, -54],
    });

    const popupTitle = `${settings.groomName} & ${settings.brideName}`;
    const popupSubtitle = settings.villageName
      ? `${settings.villageName} · ${settings.city}`
      : locale === 'fr'
      ? `Repère général : ${settings.city}, ${settings.region} Cameroun (Village de la mariée à préciser)`
      : `General landmark: ${settings.city}, ${settings.region} Cameroon (Bride’s village to be specified)`;

    const popupContent = `
      <div style="font-family: 'Poppins', sans-serif; padding: 4px 2px; min-width: 210px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #B89158; font-weight: 600;">
          1er Décembre 2026
        </p>
        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #101D35;">
          ${popupTitle}
        </p>
        <p style="margin: 0; font-size: 12px; color: #315783; line-height: 1.4;">
          ${popupSubtitle}
        </p>
      </div>
    `;

    const marker = L.marker(BANGANGTE_COORDS, { icon: customIcon }).addTo(map);
    marker.bindPopup(popupContent).openPopup();

    // Fix resize rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [locale, settings.groomName, settings.brideName, settings.villageName, settings.city, settings.region]);

  const resetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(BANGANGTE_COORDS, 13, { animate: true });
    }
  };

  return (
    <div className="bg-white border border-[#183153]/15 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start sm:items-center gap-2.5">
          <MapPin className="w-4 h-4 text-[#B89158] shrink-0 mt-1 sm:mt-0" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#101D35]">
              {locale === 'fr'
                ? 'Carte interactive — Bangangté, Ouest Cameroun'
                : 'Interactive Map — Bangangté, West Cameroon'}
            </h3>
            <p className="text-xs text-[#19263B]/70">
              {settings.villageName
                ? `${settings.villageName} · ${settings.city}`
                : locale === 'fr'
                ? 'Vue générale de la localité de Bangangté. Le point exact du village de la mariée sera mis à jour dès confirmation.'
                : 'General view of Bangangté. The exact pin for the bride’s family village will be updated once confirmed.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetCenter}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#183153]/25 text-xs font-medium text-[#183153] hover:bg-[#E8EEF6]/60 transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-[#B89158]" />
          <span>{locale === 'fr' ? 'Recentrer sur Bangangté' : 'Recenter on Bangangté'}</span>
        </button>
      </div>

      <div className="relative w-full h-72 sm:h-80 border border-[#183153]/20 overflow-hidden z-0">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>
    </div>
  );
};
