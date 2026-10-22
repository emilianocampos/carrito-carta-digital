'use client';

import React, { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadDropzoneProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  tenantId: string;
  folder?: string;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
  disabled?: boolean;
}

export function ImageUploadDropzone({
  value,
  onChange,
  tenantId,
  folder = 'products',
  label = 'Foto o Imagen',
  aspectRatio = 'video',
  disabled = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const compressImage = async (file: File, maxDim = 900, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                    type: 'image/webp',
                    lastModified: Date.now(),
                  })
                );
              } else {
                resolve(file);
              }
            },
            'image/webp',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (rawFile: File) => {
    setErrorMessage(null);

    // Validar tipo de archivo
    if (!rawFile.type.startsWith('image/')) {
      setErrorMessage('Solo se permiten archivos de imagen (JPG, PNG, WebP).');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (rawFile.size > 10 * 1024 * 1024) {
      setErrorMessage('La imagen es demasiado pesada. El tamaño máximo es 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Optimizar y comprimir imagen en el cliente
      const file = await compressImage(rawFile);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${tenantId}/${folder}/${Date.now()}-${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('menu-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        // Fallback en base64 comprimido si el bucket no está disponible
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onChange(reader.result);
          }
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('menu-assets').getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-[200px]'
      : aspectRatio === 'banner'
      ? 'aspect-[21/9] w-full'
      : 'aspect-[16/10] w-full';

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-[#8496a5] block flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#00dc82]" />
          <span>{label}</span>
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        <div
          className={`relative rounded-2xl overflow-hidden border border-[#1f3240] bg-[#0c151b] group ${aspectClass}`}
        >
          <Image
            src={value}
            alt="Preview de imagen cargada"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="px-3 py-1.5 rounded-xl bg-[#00dc82] text-slate-950 font-black text-xs hover:bg-[#05f08f] transition-colors"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="p-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white transition-colors"
              title="Eliminar imagen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${aspectClass} ${
            isDragging
              ? 'border-[#00dc82] bg-[#00dc82]/10 scale-[1.01]'
              : 'border-[#1a2b37] hover:border-[#00dc82]/50 bg-[#0c151b]/70 hover:bg-[#15222b]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="space-y-2 flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#00dc82] animate-spin" />
              <p className="text-xs font-bold text-slate-300">Subiendo a Supabase Storage...</p>
            </div>
          ) : (
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-2xl bg-[#0e2a25] border border-[#00dc82]/30 text-[#00dc82] flex items-center justify-center shadow-inner">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Arrastrá una imagen o <span className="text-[#00dc82] underline">explorá tu dispositivo</span>
                </p>
                <p className="text-[10px] text-[#8496a5] mt-0.5">PNG, JPG, WebP hasta 5MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
