import type { ImageAttachment } from '../types/chat';
import { createId } from './conversations';
import { DEFAULT_LANGUAGE, t } from '../i18n';
import type { Language } from '../i18n';

export const MAX_IMAGES_PER_MESSAGE = 6;
export const MAX_RAW_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // Accept up to 15MB from mobile cameras before compression
export const MAX_COMPRESSED_DIMENSION = 1600;
export const COMPRESSION_TRIGGER_BYTES = 400 * 1024; // Compress images larger than 400KB
export const JPEG_QUALITY = 0.82;

export interface ImageProcessResult {
  added: ImageAttachment[];
  error: string | null;
}

function readFileAsDataUrl(file: File, lang: Language): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(t(lang, 'imageFiles.readFailed', { name: file.name })));
      }
    };
    reader.onerror = () =>
      reject(new Error(t(lang, 'imageFiles.readFailed', { name: file.name })));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string, lang: Language): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(t(lang, 'imageFiles.compressFailed')));
    img.src = src;
  });
}

/**
 * Compresses large images (especially high-res phone camera captures) in the browser
 * before converting to base64, keeping bandwidth low and preventing 413 payload errors.
 */
async function compressImageIfNeeded(
  file: File,
  originalDataUrl: string,
  lang: Language
): Promise<{ dataUrl: string; mimeType: string; size: number }> {
  // Keep animated GIFs and already small files untouched
  if (
    file.type === 'image/gif' ||
    file.size <= COMPRESSION_TRIGGER_BYTES ||
    typeof document === 'undefined'
  ) {
    return {
      dataUrl: originalDataUrl,
      mimeType: file.type || 'image/png',
      size: file.size,
    };
  }

  try {
    const img = await loadImageElement(originalDataUrl, lang);
    let { width, height } = img;

    if (width <= 0 || height <= 0) {
      return {
        dataUrl: originalDataUrl,
        mimeType: file.type || 'image/png',
        size: file.size,
      };
    }

    const scale = Math.min(1, MAX_COMPRESSED_DIMENSION / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        dataUrl: originalDataUrl,
        mimeType: file.type || 'image/png',
        size: file.size,
      };
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Output JPEG for photos (and WebP/PNG that are large) to achieve significant savings
    const targetMime = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const compressedDataUrl = canvas.toDataURL(targetMime, JPEG_QUALITY);

    // Only keep compressed version if it actually reduced payload size
    if (compressedDataUrl.length < originalDataUrl.length) {
      const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);
      return {
        dataUrl: compressedDataUrl,
        mimeType: targetMime,
        size: approxBytes,
      };
    }

    return {
      dataUrl: originalDataUrl,
      mimeType: file.type || 'image/png',
      size: file.size,
    };
  } catch {
    return {
      dataUrl: originalDataUrl,
      mimeType: file.type || 'image/png',
      size: file.size,
    };
  }
}

export async function processImageFiles(
  files: FileList | File[],
  existingCount: number,
  lang: Language = DEFAULT_LANGUAGE
): Promise<ImageProcessResult> {
  const fileArray = Array.from(files);
  const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    return {
      added: [],
      error: t(lang, 'imageFiles.invalidType'),
    };
  }

  const remainingSlots = MAX_IMAGES_PER_MESSAGE - existingCount;
  if (remainingSlots <= 0) {
    return {
      added: [],
      error: t(lang, 'imageFiles.maxImagesReached', {
        max: MAX_IMAGES_PER_MESSAGE,
      }),
    };
  }

  const toProcess = imageFiles.slice(0, remainingSlots);
  const added: ImageAttachment[] = [];
  let warning: string | null =
    imageFiles.length > remainingSlots
      ? t(lang, 'imageFiles.partialAdded', {
          count: remainingSlots,
          max: MAX_IMAGES_PER_MESSAGE,
        })
      : null;

  for (const file of toProcess) {
    if (file.size > MAX_RAW_IMAGE_SIZE_BYTES) {
      warning = t(lang, 'imageFiles.fileTooLarge', { name: file.name });
      continue;
    }

    try {
      const originalDataUrl = await readFileAsDataUrl(file, lang);
      const { dataUrl, mimeType, size } = await compressImageIfNeeded(
        file,
        originalDataUrl,
        lang
      );
      const commaIndex = dataUrl.indexOf(',');
      const data = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;

      added.push({
        id: createId('img'),
        name: file.name || t(lang, 'imageFiles.defaultImageName'),
        mimeType,
        data,
        previewUrl: dataUrl,
        size,
      });
    } catch {
      warning = t(lang, 'imageFiles.readFailed', { name: file.name });
    }
  }

  return { added, error: warning };
}
