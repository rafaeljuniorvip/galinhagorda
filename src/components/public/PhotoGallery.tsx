'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, IconButton, Modal, Grid,
} from '@mui/material';
import {
  Close, ChevronLeft, ChevronRight, PhotoLibrary,
} from '@mui/icons-material';
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <PhotoLibrary sx={{ color: '#1a237e' }} />
        <Typography variant="h5" fontWeight={700} sx={{ color: '#1a237e' }}>
          {title}
        </Typography>
      </Box>

      <Grid container spacing={1}>
        {photos.map((photo, index) => (
          <Grid item xs={6} sm={4} md={3} key={photo.id}>
            <Box
              onClick={() => handleOpen(index)}
              sx={{
                width: '100%',
                paddingTop: '100%',
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  '& .overlay': { opacity: 1 },
                },
              }}
            >
              <Box
                component="img"
                src={photo.thumbnail_url || photo.url}
                alt={photo.caption || ''}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                className="overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'flex-end',
                  p: 1,
                }}
              >
                {photo.caption && (
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {photo.caption}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Lightbox Modal */}
      <Modal
        open={selectedIndex !== null}
        onClose={handleClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '90vw',
            height: '90vh',
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 2,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <Close />
          </IconButton>

          {/* Previous button */}
          {photos.length > 1 && (
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                zIndex: 2,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <ChevronLeft sx={{ fontSize: 36 }} />
            </IconButton>
          )}

          {/* Next button */}
          {photos.length > 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                zIndex: 2,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <ChevronRight sx={{ fontSize: 36 }} />
            </IconButton>
          )}

          {/* Image */}
          {currentPhoto && (
            <>
              <Box
                component="img"
                src={currentPhoto.url}
                alt={currentPhoto.caption || ''}
                sx={{
                  maxWidth: '100%',
                  maxHeight: 'calc(90vh - 60px)',
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
              {currentPhoto.caption && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'white',
                    mt: 1,
                    textAlign: 'center',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {currentPhoto.caption}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}
              >
                {(selectedIndex ?? 0) + 1} / {photos.length}
              </Typography>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
