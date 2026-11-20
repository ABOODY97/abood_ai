import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ImageAttachment } from '../types/chat';

interface ImageLightboxProps {
  image: ImageAttachment | null;
  onClose: () => void;
}

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!image) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`معاينة الصورة ${image.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[88vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق معاينة الصورة"
          className="self-end inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/90 text-white hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={image.previewUrl}
          alt={image.name}
          referrerPolicy="no-referrer"
          className="max-h-[78vh] max-w-full rounded-xl object-contain border border-white/10 shadow-2xl"
        />
        <span className="text-xs text-slate-300 truncate max-w-full">
          {image.name}
        </span>
      </div>
    </div>
  );
}
