'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { MediaItem } from '@/types';

interface MediaUploaderProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

const MAX_IMAGES = 9;
const MAX_VIDEOS = 1;

export default function MediaUploader({ items, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const imageCount = items.filter((i) => i.type === 'image').length;
  const videoCount = items.filter((i) => i.type === 'video').length;
  const canAddImage = imageCount < MAX_IMAGES;
  const canAddVideo = videoCount < MAX_VIDEOS;
  const canAddMore = canAddImage || canAddVideo;

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

    if (!isVideo) {
      const resized = await resizeImage(file);
      fileToUpload = resized.blob;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload, file.name);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro no upload');
    }

    const { path, url, type } = await res.json();

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
    onChange(items.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
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
              onClick={() => fileInputRef.current?.click()}
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

      {/* Empty state */}
      {items.length === 0 && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-warm-300 rounded-2xl"
        >
          <div className="py-8 flex flex-col items-center justify-center text-warm-400 px-4">
            <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-warm-500 mb-1">Adicione fotos e vídeos</p>
            <p className="text-xs text-warm-400 mb-4">Até {MAX_IMAGES} fotos e {MAX_VIDEOS} vídeo</p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-600 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tirar foto
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-warm-800 text-white rounded-lg text-sm font-medium hover:bg-warm-700 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Gravar vídeo
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-warm-100 text-warm-700 rounded-lg text-sm font-medium hover:bg-warm-200 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Escolher arquivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {uploading && items.length === 0 && (
        <div className="border-2 border-dashed border-warm-300 rounded-2xl py-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Action buttons when items exist */}
      {items.length > 0 && canAddMore && !uploading && (
        <div className="flex flex-wrap gap-2 mt-2">
          {canAddImage && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-navy-700 bg-navy-50 rounded-lg hover:bg-navy-100 active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Tirar foto
            </button>
          )}
          {canAddVideo && (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-warm-700 bg-warm-100 rounded-lg hover:bg-warm-200 active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Gravar vídeo
            </button>
          )}
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && items.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-navy-600 mt-2">
          <div className="w-4 h-4 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
          Enviando...
        </div>
      )}

      {/* Hidden inputs */}
      {/* File picker (gallery) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
      {/* Camera capture (photo) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
      {/* Camera capture (video) */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <p className="text-xs text-warm-400 mt-2">
        {imageCount}/{MAX_IMAGES} fotos &middot; {videoCount}/{MAX_VIDEOS} vídeo
      </p>
    </div>
  );
}
