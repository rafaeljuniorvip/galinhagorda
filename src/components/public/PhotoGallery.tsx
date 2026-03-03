'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { Photo } from '@/types';

interface Props {
  photos: Photo[];
  title?: string;
}

export default function PhotoGallery({ photos, title = 'Galeria de Fotos' }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleOpen = (index: number) => setSelectedIndex(index);
  const handleClose = () => setSelectedIndex(null);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1);
  }, [selectedIndex, photos.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0);
  }, [selectedIndex, photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handlePrev, handleNext]);

  if (photos.length === 0) return null;

  const currentPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Images className="h-6 w-6 text-[#1a237e]" />
        <h2 className="text-xl font-bold text-[#1a237e]">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => handleOpen(index)}
            className="relative w-full pt-[100%] rounded overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.03] group"
          >
            <img
              src={photo.thumbnail_url || photo.url}
              alt={photo.caption || ''}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-end p-2">
              {photo.caption && (
                <span className="text-xs text-white">
                  {photo.caption}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={handleClose}
        >
          <div
            className="relative w-[90vw] h-[90vh] flex flex-col items-center justify-center outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 z-10 p-2 rounded-full text-white bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Previous button */}
            {photos.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full text-white bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-9 w-9" />
              </button>
            )}

            {/* Next button */}
            {photos.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full text-white bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-9 w-9" />
              </button>
            )}

            {/* Image */}
            {currentPhoto && (
              <>
                <img
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || ''}
                  className="max-w-full max-h-[calc(90vh-60px)] object-contain rounded"
                />
                {currentPhoto.caption && (
                  <p className="text-sm text-white mt-2 text-center bg-black/60 px-4 py-1 rounded">
                    {currentPhoto.caption}
                  </p>
                )}
                <span className="text-xs text-white/70 mt-1">
                  {(selectedIndex ?? 0) + 1} / {photos.length}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
