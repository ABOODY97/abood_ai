import type { ImageAttachment } from '../types/chat';
import { createId } from './conversations';

export const MAX_IMAGES_PER_MESSAGE = 6;
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB per image

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
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      warning = `الصورة "${file.name}" تتجاوز الحد المسموح (8 ميجابايت).`;
      continue;
    }

    try {
      const previewUrl = await readFileAsDataUrl(file);
      const commaIndex = previewUrl.indexOf(',');
      const data = commaIndex >= 0 ? previewUrl.slice(commaIndex + 1) : previewUrl;

      added.push({
        id: createId('img'),
        name: file.name || 'صورة مرفقة',
        mimeType: file.type || 'image/png',
        data,
        previewUrl,
        size: file.size,
      });
    } catch {
      warning = `تعذّرت قراءة الصورة "${file.name}".`;
    }
  }

  return { added, error: warning };
}
