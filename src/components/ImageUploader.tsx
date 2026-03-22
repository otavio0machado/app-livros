'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  onUpload: (data: { path: string; url: string; base64: string; mimeType: string }) => void;
  currentUrl?: string;
}

export default function ImageUploader({ onUpload, currentUrl }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleFile(file: File) {
    setError('');
    setUploading(true);

    try {
      // Resize image client-side
      const { blob, base64 } = await resizeImage(file);
      setPreview(URL.createObjectURL(blob));

      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', blob, `${Date.now()}.jpg`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      const { path, url } = await res.json();
      onUpload({ path, url, base64, mimeType: 'image/jpeg' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition overflow-hidden ${
          uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        {preview ? (
          <div className="relative aspect-square">
            <Image src={preview} alt="Preview" fill className="object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center text-gray-400 p-4">
            {uploading ? (
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">Toque para adicionar foto</p>
                <p className="text-xs mt-1">ou arraste a imagem aqui</p>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
