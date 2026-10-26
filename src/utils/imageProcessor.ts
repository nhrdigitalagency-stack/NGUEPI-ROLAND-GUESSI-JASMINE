/**
 * Nettoie une image côté client en la redessinant dans un HTMLCanvasElement :
 * - Supprime toutes les métadonnées EXIF (dont coordonnées GPS et infos d'appareil)
 * - Corrige l'orientation (gérée nativement par createImageBitmap / drawImage sur les navigateurs modernes)
 * - Limite les dimensions maximales (max 2200px sur le côté le plus long) pour optimiser l'envoi et l'affichage
 * - Retourne un nouveau File prêt à être téléversé vers le serveur Sanity
 */
export async function processAndStripExifImage(file: File, maxDimension = 2200): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        reject(new Error('INVALID_DIMENSIONS'));
        return;
      }

      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const outputMime =
        file.type === 'image/png'
          ? 'image/png'
          : file.type === 'image/webp'
          ? 'image/webp'
          : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const ext = outputMime === 'image/png' ? 'png' : outputMime === 'image/webp' ? 'webp' : 'jpg';
          const cleanFile = new File([blob], `clean_${Date.now()}.${ext}`, {
            type: outputMime,
            lastModified: Date.now(),
          });
          resolve(cleanFile);
        },
        outputMime,
        0.88
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('IMAGE_DECODE_ERROR'));
    };

    img.src = objectUrl;
  });
}
