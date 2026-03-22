'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/types';

interface MediaUploaderProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  onFirstImageBase64?: (base64: string, mimeType: string) => void;
}

const MAX_IMAGES = 9;
const MAX_VIDEOS = 1;

export default function MediaUploader({ items, onChange, onFirstImageBase64 }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const imageCount = items.filter((i) => i.type === 'image').length;
  const videoCount = items.filter((i) => i.type === 'video').length;
  const canAddMore = imageCount < MAX_IMAGES || videoCount < MAX_VIDEOS;

  async function resizeImage(file: File): Promise<{ blob: Blob; base64: string }> {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1200;
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height / width) * MAX_SIZE;
            width = MAX_SIZE;
          } else {
            width = (width / height) * MAX_SIZE;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({ blob: blob!, base64 });
            };
            reader.readAsDataURL(blob!);
          },
          'image/jpeg',
          0.8
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function uploadFile(file: File): Promise<MediaItem | null> {
    const isVideo = file.type.startsWith('video/');
    let fileToUpload: Blob = file;
    let base64ForAI: string | null = null;

    if (!isVideo) {
      const resized = await resizeImage(file);
      fileToUpload = resized.blob;
      base64ForAI = resized.base64;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload, file.name);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro no upload');
    }

    const { path, url, type } = await res.json();

    // Send base64 for AI analysis on first image
    if (base64ForAI && onFirstImageBase64 && items.filter((i) => i.type === 'image').length === 0) {
      onFirstImageBase64(base64ForAI, 'image/jpeg');
    }

    return { url, type, path };
  }

  async function handleFiles(files: FileList) {
    setError('');
    setUploading(true);

    const newItems: MediaItem[] = [];
    let currentImages = imageCount;
    let currentVideos = videoCount;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');

      if (isVideo && currentVideos >= MAX_VIDEOS) {
        setError(`Máximo ${MAX_VIDEOS} vídeo por anúncio.`);
        continue;
      }
      if (!isVideo && currentImages >= MAX_IMAGES) {
        setError(`Máximo ${MAX_IMAGES} fotos por anúncio.`);
        continue;
      }

      try {
        const item = await uploadFile(file);
        if (item) {
          newItems.push(item);
          if (isVideo) currentVideos++;
          else currentImages++;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro no upload');
      }
    }

    if (newItems.length > 0) {
      onChange([...items, ...newItems]);
    }
    setUploading(false);
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {/* Grid of uploaded items */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {items.map((item, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-warm-100 border border-warm-200">
              {item.type === 'image' ? (
                <Image src={item.url} alt={`Mídia ${i + 1}`} fill className="object-cover" sizes="120px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-warm-800">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-navy-700 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Add more button */}
          {canAddMore && !uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-warm-300 flex flex-col items-center justify-center text-warm-400 hover:border-navy-400 hover:text-navy-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[10px] mt-1">Adicionar</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state / Initial upload area */}
      {items.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-warm-300 rounded-2xl cursor-pointer hover:border-navy-400 transition-colors"
        >
          <div className="py-10 flex flex-col items-center justify-center text-warm-400">
            {uploading ? (
              <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-warm-500">Toque para adicionar fotos ou vídeos</p>
                <p className="text-xs mt-1">Até {MAX_IMAGES} fotos e {MAX_VIDEOS} vídeo</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && items.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-navy-600 mt-2">
          <div className="w-4 h-4 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
          Enviando...
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <p className="text-xs text-warm-400 mt-2">
        {imageCount}/{MAX_IMAGES} fotos &middot; {videoCount}/{MAX_VIDEOS} vídeo
      </p>
    </div>
  );
}
