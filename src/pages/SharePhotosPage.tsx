import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { processAndStripExifImage } from '../utils/imageProcessor';

interface QueuedPhotoFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_FILES_PER_BATCH = 10;

export const SharePhotosPage: React.FC = () => {
  const { t, settings, refreshData } = useWedding();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [authorName, setAuthorName] = useState('');
  const [caption, setCaption] = useState('');
  const [showAuthorName, setShowAuthorName] = useState(true);
  const [consent, setConsent] = useState(false);

  const [queue, setQueue] = useState<QueuedPhotoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    author?: string;
    consent?: string;
    files?: string;
  }>({});
  const [batchResult, setBatchResult] = useState<'none' | 'all-success' | 'partial'>('none');

  const addFilesToQueue = (selectedFiles: FileList | File[]) => {
    const incoming = Array.from(selectedFiles);
    setFormErrors((prev) => ({ ...prev, files: undefined }));

    if (queue.length + incoming.length > MAX_FILES_PER_BATCH) {
      setFormErrors((prev) => ({ ...prev, files: t.upload.errors.tooManyFiles }));
      return;
    }

    const newItems: QueuedPhotoFile[] = [];

    for (const file of incoming) {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (!ALLOWED_TYPES.includes(file.type)) {
        newItems.push({
          id,
          file,
          previewUrl: '',
          status: 'error',
          progress: 0,
          errorMessage: t.upload.errors.invalidFormat,
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        newItems.push({
          id,
          file,
          previewUrl: '',
          status: 'error',
          progress: 0,
          errorMessage: t.upload.errors.fileTooLarge,
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id,
        file,
        previewUrl,
        status: 'pending',
        progress: 0,
      });
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearAll = () => {
    queue.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueue([]);
    setBatchResult('none');
  };

  // Envoi individuel d'un fichier avec suivi de progression réel via XMLHttpRequest
  const uploadSinglePhoto = async (item: QueuedPhotoFile): Promise<boolean> => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === item.id ? { ...q, status: 'processing', progress: 15, errorMessage: undefined } : q
      )
    );

    try {
      // 1. Suppression des métadonnées EXIF / GPS et correction d'orientation via Canvas
      const cleanFile = await processAndStripExifImage(item.file);

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, progress: 35 } : q))
      );

      // 2. Envoi multipart vers le backend /api/photos/upload (Sanity Assets + Modération)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('photo', cleanFile);
        formData.append('authorName', authorName.trim());
        formData.append('caption', caption.trim());
        formData.append('showAuthorName', String(showAuthorName));
        formData.append('consent', String(consent));

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.min(95, 35 + Math.round((event.loaded / event.total) * 60));
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: pct } : q))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`HTTP_${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('NETWORK_ERROR'));

        xhr.open('POST', '/api/photos/upload');
        xhr.send(formData);
      });

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
      );
      return true;
    } catch (err) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'error', progress: 0, errorMessage: t.upload.statusError }
            : q
        )
      );
      return false;
    }
  };

  const handleUploadBatch = async (onlyFailed = false) => {
    const errs: typeof formErrors = {};
    if (!authorName.trim()) {
      errs.author = t.upload.errors.authorRequired;
    }
    if (!consent) {
      errs.consent = t.upload.errors.consentRequired;
    }
    const candidates = queue.filter((q) =>
      onlyFailed ? q.status === 'error' && q.previewUrl : q.status === 'pending' || q.status === 'error'
    );
    if (candidates.length === 0) {
      errs.files = t.upload.errors.noFiles;
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsUploading(true);
    setBatchResult('none');

    let successCount = 0;
    let failCount = 0;

    for (const item of candidates) {
      if (!item.previewUrl) {
        failCount++;
        continue;
      }
      const ok = await uploadSinglePhoto(item);
      if (ok) successCount++;
      else failCount++;
    }

    setIsUploading(false);
    await refreshData();

    if (successCount > 0 && failCount === 0) {
      setBatchResult('all-success');
    } else if (successCount > 0 && failCount > 0) {
      setBatchResult('partial');
    }
  };

  const hasFailedRetryable = queue.some((q) => q.status === 'error' && Boolean(q.previewUrl));

  return (
    <div className="min-h-screen bg-[#FBF8F1] py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/souvenirs"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#315783] hover:text-[#183153] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.upload.backToGallery}</span>
          </Link>
        </div>

        <div className="bg-white border border-[#183153]/15 p-7 sm:p-12">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#315783] mb-2">
            {t.upload.kicker}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#101D35] font-normal mb-4">
            {t.upload.title}
          </h1>
          <p className="text-sm sm:text-base text-[#19263B]/80 leading-relaxed mb-8">
            {t.upload.subtitle}
          </p>

          {!settings.contributionsOpen ? (
            <div className="p-6 bg-[#E8EEF6]/60 border border-[#183153]/20 text-sm text-[#183153]">
              {t.upload.closedNotice}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUploadBatch(false);
              }}
              noValidate
              className="space-y-7"
            >
              {/* Bannière de réussite réelle après upload */}
              {batchResult === 'all-success' && (
                <div
                  role="status"
                  className="p-5 bg-[#183153] text-[#FBF8F1] border border-[#B89158] flex items-start gap-3.5"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#B89158] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-serif text-xl text-[#FBF8F1] mb-1">
                      {t.upload.successBanner}
                    </p>
                    <p className="text-xs sm:text-sm text-[#E8EEF6]/85 leading-relaxed">
                      {t.upload.successDetail}
                    </p>
                  </div>
                </div>
              )}

              {batchResult === 'partial' && (
                <div
                  role="status"
                  className="p-5 bg-[#E8EEF6] text-[#101D35] border border-[#B89158] flex items-start gap-3.5"
                >
                  <AlertCircle className="w-5 h-5 text-[#B89158] shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {t.upload.partialBanner}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="upload-author"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                  >
                    {t.upload.authorLabel} *
                  </label>
                  <input
                    id="upload-author"
                    type="text"
                    value={authorName}
                    onChange={(e) => {
                      setAuthorName(e.target.value);
                      if (formErrors.author) setFormErrors({ ...formErrors, author: undefined });
                    }}
                    placeholder={t.upload.authorPlaceholder}
                    className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-sm text-[#19263B] focus:outline-none focus:border-[#183153]"
                  />
                  {formErrors.author && (
                    <p className="mt-1.5 text-xs text-red-700" role="alert">
                      {formErrors.author}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="upload-caption"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#183153] mb-2"
                  >
                    {t.upload.captionLabel}
                  </label>
                  <input
                    id="upload-caption"
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={t.upload.captionPlaceholder}
                    className="w-full px-4 py-3 border border-[#183153]/25 bg-[#FBF8F1]/50 text-sm text-[#19263B] focus:outline-none focus:border-[#183153]"
                  />
                </div>
              </div>

              {/* Zone Glisser-Déposer */}
              <div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      addFilesToQueue(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed p-8 sm:p-10 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-[#183153] bg-[#E8EEF6]/60'
                      : 'border-[#183153]/25 bg-[#FBF8F1]/50 hover:border-[#183153]/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        addFilesToQueue(e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 mx-auto mb-3 text-[#183153]" />
                  <p className="font-serif text-xl text-[#101D35] mb-1">
                    {t.upload.dropzoneTitle}
                  </p>
                  <p className="text-xs text-[#19263B]/70">
                    {t.upload.dropzoneSpecs}
                  </p>
                </div>

                {formErrors.files && (
                  <p className="mt-2 text-xs text-red-700" role="alert">
                    {formErrors.files}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-[#315783]">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#B89158]" />
                  <span>{t.upload.privacyNote}</span>
                </div>
              </div>

              {/* Liste des fichiers sélectionnés avec aperçu et progression réelle */}
              {queue.length > 0 && (
                <div className="space-y-3 border-t border-[#183153]/15 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#183153] font-mono tabular-nums">
                      {queue.length} / {MAX_FILES_PER_BATCH} photos
                    </span>
                    <button
                      type="button"
                      onClick={clearAll}
                      disabled={isUploading}
                      className="text-xs text-[#315783] hover:text-red-700 underline cursor-pointer"
                    >
                      {t.upload.clearAllBtn}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3.5 p-3 border border-[#183153]/15 bg-[#FBF8F1]/60"
                      >
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="w-16 h-16 object-cover bg-[#101D35] shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#101D35] truncate">
                            {item.file.name}
                          </p>
                          <p className="text-[11px] text-[#19263B]/70 font-mono tabular-nums">
                            {(item.file.size / (1024 * 1024)).toFixed(2)} Mo
                          </p>

                          {/* Barre de progression et statut par fichier */}
                          <div className="mt-1.5">
                            {item.status === 'pending' && (
                              <span className="text-[11px] text-[#315783]">
                                {t.upload.statusPending}
                              </span>
                            )}
                            {item.status === 'processing' && (
                              <div className="space-y-1">
                                <span className="text-[11px] text-[#183153] font-medium">
                                  {t.upload.statusProcessing} ({item.progress}%)
                                </span>
                                <div className="w-full h-1.5 bg-[#E8EEF6]">
                                  <div
                                    className="h-full bg-[#183153] transition-all duration-200"
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {item.status === 'success' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t.upload.statusSuccess}
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-700 font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {item.errorMessage || t.upload.statusError}
                              </span>
                            )}
                          </div>
                        </div>

                        {!isUploading && item.status !== 'success' && (
                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            aria-label="Retirer ce fichier"
                            className="p-1.5 text-[#19263B]/60 hover:text-red-700 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cases à cocher d'autorisation et de consentement obligatoire */}
              <div className="space-y-3 pt-2 border-t border-[#183153]/15">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAuthorName}
                    onChange={(e) => setShowAuthorName(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#183153]"
                  />
                  <span className="text-xs sm:text-sm text-[#19263B]/85">
                    {t.upload.showAuthorLabel}
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (formErrors.consent) setFormErrors({ ...formErrors, consent: undefined });
                    }}
                    className="mt-1 w-4 h-4 accent-[#183153]"
                  />
                  <span className="text-xs sm:text-sm text-[#19263B] font-medium">
                    {t.upload.consentLabel} *
                  </span>
                </label>
                {formErrors.consent && (
                  <p className="text-xs text-red-700" role="alert">
                    {formErrors.consent}
                  </p>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-4 px-6 bg-[#183153] text-[#FBF8F1] text-sm font-medium tracking-wide hover:bg-[#101D35] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isUploading ? t.upload.uploadingBtn : t.upload.submitBtn}
                </button>

                {hasFailedRetryable && !isUploading && (
                  <button
                    type="button"
                    onClick={() => handleUploadBatch(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-4 border border-[#183153] text-[#183153] text-xs font-medium hover:bg-[#E8EEF6]/60 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.upload.retryFailedBtn}</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
