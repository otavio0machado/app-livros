'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/types';

export default function MediaGallery({ items }: { items: MediaItem[] }) {
  const [selected, setSelected] = useState(0);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-warm-100 border border-warm-200/80">
        <div className="aspect-[4/5] sm:aspect-[3/4] flex items-center justify-center text-warm-300">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
    );
  }

  const current = items[selected];

  return (
    <div>
      {/* Main view */}
      <div className="rounded-2xl overflow-hidden bg-warm-100 border border-warm-200/80">
        <div className="relative aspect-[4/5] sm:aspect-[3/4]">
          {current.type === 'video' ? (
            <video
              src={current.url}
              controls
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <Image
              src={current.url}
              alt={`Foto ${selected + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 600px"
              priority={selected === 0}
            />
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                i === selected ? 'border-navy-600' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-warm-800 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : (
                <Image src={item.url} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="64px" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
