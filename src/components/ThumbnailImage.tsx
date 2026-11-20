import { useState } from 'react';
import { Package } from 'lucide-react';

interface ThumbnailImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ThumbnailImage({ src, alt, className = 'w-16 h-16 rounded-xl' }: ThumbnailImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 shrink-0`}
        aria-label={alt}
      >
        <Package className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover shrink-0 bg-slate-100`}
    />
  );
}
