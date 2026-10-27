'use client';

import React, { useState, useRef, useTransition } from 'react';
import Image from 'next/image';
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  Move,
  RotateCcw,
  Check,
  ZoomIn,
  SlidersHorizontal,
} from 'lucide-react';
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

  // Estados para herramienta de encuadre (Mover en X e Y)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [offsetX, setOffsetX] = useState<number>(0); // -50% a +50%
  const [offsetY, setOffsetY] = useState<number>(0); // -50% a +50%
  const [zoom, setZoom] = useState<number>(1); // 1x a 2.5x
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 });

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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsPointerDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDragging) return;
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    const sensitivity = 0.25;
    const nextX = Math.min(50, Math.max(-50, Math.round(dragStartPos.current.startOffsetX + deltaX * sensitivity)));
    const nextY = Math.min(50, Math.max(-50, Math.round(dragStartPos.current.startOffsetY + deltaY * sensitivity)));
    setOffsetX(nextX);
    setOffsetY(nextY);
  };

  const handlePointerUp = () => {
    setIsPointerDragging(false);
  };

  const handleApplyCrop = async () => {
    if (!value) return;
    setIsSavingCrop(true);
    try {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = value;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const targetWidth = 1000;
      const targetHeight = aspectRatio === 'square' ? 1000 : aspectRatio === 'banner' ? 428 : 625;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      const imgAspect = img.width / img.height;
      const canvasAspect = targetWidth / targetHeight;

      let drawW: number;
      let drawH: number;
      if (imgAspect > canvasAspect) {
        drawH = targetHeight;
        drawW = targetHeight * imgAspect;
      } else {
        drawW = targetWidth;
        drawH = targetWidth / imgAspect;
      }

      drawW *= zoom;
      drawH *= zoom;

      const baseX = (targetWidth - drawW) / 2;
      const baseY = (targetHeight - drawH) / 2;

      const shiftX = (offsetX / 100) * targetWidth;
      const shiftY = (offsetY / 100) * targetHeight;

      ctx.drawImage(img, baseX + shiftX, baseY + shiftY, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/webp', 0.85)
      );

      if (!blob) throw new Error('Error al generar imagen');

      const framedFile = new File([blob], `framed_${Date.now()}.webp`, {
        type: 'image/webp',
      });

      const filePath = `${tenantId}/${folder}/${Date.now()}-framed.webp`;
      const { data, error } = await supabase.storage
        .from('menu-assets')
        .upload(filePath, framedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('menu-assets').getPublicUrl(data.path);
        onChange(publicUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onChange(reader.result);
          }
        };
        reader.readAsDataURL(framedFile);
      }

      setIsAdjustModalOpen(false);
    } catch (err: unknown) {
      console.error('Error aplicando encuadre:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar el encuadre');
    } finally {
      setIsSavingCrop(false);
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
        <div className="space-y-2">
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
                onClick={() => setIsAdjustModalOpen(true)}
                disabled={disabled || isUploading}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                title="Ajustar posición en X e Y y Zoom"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Mover X/Y</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="px-3 py-1.5 rounded-xl bg-[#00dc82] text-slate-950 font-black text-xs hover:bg-[#05f08f] transition-colors cursor-pointer"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fila informativa con acceso directo para dispositivos táctiles */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> Foto cargada
            </span>
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(true)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <Move className="w-3 h-3" />
              <span>Ajustar encuadre (X / Y)</span>
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

      {/* Modal Interactivo de Ajuste de Encuadre (Mover X / Y / Zoom) */}
      {isAdjustModalOpen && value && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl text-white">
            {/* Header del Modal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Ajustar Encuadre (Mover X / Y)</h3>
                  <p className="text-xs text-slate-400">Arrastrá la foto o usá los controles para centrar el plato</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visor interactivo con aspecto de la card */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border-2 border-indigo-500/40 bg-black flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
            >
              <img
                src={value}
                alt="Ajuste de encuadre"
                draggable={false}
                style={{
                  transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isPointerDragging ? 'none' : 'transform 0.1s ease-out',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                className="pointer-events-none select-none"
              />

              {/* Guías de regla de tercios para ayudar a encuadrar el plato */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div />
              </div>

              {/* Badge indicador táctil */}
              <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-white/90 border border-white/10 pointer-events-none flex items-center gap-1.5 shadow-sm">
                <Move className="w-3 h-3 text-indigo-400" />
                <span>Arrastrá con mouse o dedo para mover</span>
              </div>
            </div>

            {/* Controles de Precisión (Sliders X, Y, Zoom) */}
            <div className="space-y-3 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
              {/* Eje X */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Posición Horizontal (Eje X)</span>
                  <span className="font-mono text-indigo-400">{offsetX > 0 ? `+${offsetX}%` : `${offsetX}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={offsetX}
                  onChange={(e) => setOffsetX(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Eje Y */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Posición Vertical (Eje Y)</span>
                  <span className="font-mono text-indigo-400">{offsetY > 0 ? `+${offsetY}%` : `${offsetY}%`}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Zoom */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-1">
                    <ZoomIn className="w-3 h-3 text-slate-400" />
                    <span>Zoom / Escala</span>
                  </span>
                  <span className="font-mono text-indigo-400">{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Botones de acción del Modal */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOffsetX(0);
                  setOffsetY(0);
                  setZoom(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Centrar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isSavingCrop}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00dc82] hover:bg-[#05f08f] text-slate-950 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCrop ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Guardar Encuadre</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
