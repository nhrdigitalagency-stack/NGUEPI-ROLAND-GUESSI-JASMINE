/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WeddingProvider } from './context/WeddingContext';
import { Header, Footer } from './components/Layout';
import { FairePartIntro } from './components/FairePartIntro';
import { HomePage } from './pages/HomePage';
import { GalleryPage } from './pages/GalleryPage';
import { SharePhotosPage } from './pages/SharePhotosPage';
import { AdminPage } from './pages/AdminPage';
import { PrivacyPage } from './pages/PrivacyPage';

export default function App() {
  return (
    <WeddingProvider>
      <BrowserRouter>
        <FairePartIntro />
        <div className="min-h-screen flex flex-col bg-[#FBF8F1] text-[#19263B]">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/souvenirs" element={<GalleryPage />} />
              <Route path="/partager-des-photos" element={<SharePhotosPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/confidentialite" element={<PrivacyPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </WeddingProvider>
  );
}
