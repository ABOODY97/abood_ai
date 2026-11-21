import type { ImageAttachment } from '../types/chat';
import { createId } from './conversations';

export const MAX_IMAGES_PER_MESSAGE = 6;
export const MAX_RAW_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // Accept up to 15MB from mobile cameras before compression
export const MAX_COMPRESSED_DIMENSION = 1600;
export const COMPRESSION_TRIGGER_BYTES = 400 * 1024; // Compress images larger than 400KB
export const JPEG_QUALITY = 0.82;

export interface ImageProcessResult {
  added: ImageAttachment[];
  error: string | null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('تعذّرت قراءة ملف الصورة.'));
      }
    };
    reader.onerror = () => reject(new Error('تعذّرت قراءة ملف الصورة.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('تعذّر تحميل الصورة للضغط.'));
    img.src = src;
  });
}

/**
 * Compresses large images (especially high-res phone camera captures) in the browser
 * before converting to base64, keeping bandwidth low and preventing 413 payload errors.
 */
async function compressImageIfNeeded(
  file: File,
  originalDataUrl: string
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
    const img = await loadImageElement(originalDataUrl);
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
  existingCount: number
): Promise<ImageProcessResult> {
  const fileArray = Array.from(files);
  const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    return {
      added: [],
      error: 'يرجى اختيار ملفات صور صالحة فقط (PNG، JPG، WebP، GIF).',
    };
  }

  const remainingSlots = MAX_IMAGES_PER_MESSAGE - existingCount;
  if (remainingSlots <= 0) {
    return {
      added: [],
      error: `يمكنك إرفاق ما يصل إلى ${MAX_IMAGES_PER_MESSAGE} صور في الرسالة الواحدة.`,
    };
  }

  const toProcess = imageFiles.slice(0, remainingSlots);
  const added: ImageAttachment[] = [];
  let warning: string | null =
    imageFiles.length > remainingSlots
      ? `تمت إضافة أول ${remainingSlots} صور فقط (الحد الأقصى ${MAX_IMAGES_PER_MESSAGE} صور في الرسالة).`
      : null;

  for (const file of toProcess) {
    if (file.size > MAX_RAW_IMAGE_SIZE_BYTES) {
      warning = `الصورة "${file.name}" كبيرة جداً (الحد الأقصى 15 ميجابايت قبل الضغط).`;
      continue;
    }

    try {
      const originalDataUrl = await readFileAsDataUrl(file);
      const { dataUrl, mimeType, size } = await compressImageIfNeeded(
        file,
        originalDataUrl
      );
      const commaIndex = dataUrl.indexOf(',');
      const data = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;

      added.push({
        id: createId('img'),
        name: file.name || 'صورة مرفقة',
        mimeType,
        data,
        previewUrl: dataUrl,
        size,
      });
    } catch {
      warning = `تعذّرت قراءة الصورة "${file.name}".`;
    }
  }

  return { added, error: warning };
}
