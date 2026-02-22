'use client';

import { useState } from 'react';
import { IconButton, Typography, Box } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface Props {
  messageId: string;
  initialCount: number;
  initialLiked?: boolean;
  size?: 'small' | 'medium';
}

export default function LikeButton({ messageId, initialCount, initialLiked = false, size = 'small' }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const handleLike = async () => {
    // Optimistic update
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    try {
      const res = await fetch(`/api/messages/${messageId}/like`, {
        method: 'POST',
      });
      const json = await res.json();

      if (json.success) {
        setCount(json.newCount);
        setLiked(json.liked);
      } else {
        // Revert
        setLiked(prevLiked);
        setCount(prevCount);
      }
    } catch {
      // Revert
      setLiked(prevLiked);
      setCount(prevCount);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <IconButton
        onClick={handleLike}
        size={size}
        sx={{
          color: liked ? '#e91e63' : 'rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
          transform: animating ? 'scale(1.3)' : 'scale(1)',
          '&:hover': {
            color: liked ? '#c2185b' : '#e91e63',
            bgcolor: 'rgba(233,30,99,0.08)',
          },
        }}
      >
        {liked ? (
          <FavoriteIcon sx={{ fontSize: size === 'small' ? 18 : 22 }} />
        ) : (
          <FavoriteBorderIcon sx={{ fontSize: size === 'small' ? 18 : 22 }} />
        )}
      </IconButton>
      <Typography
        variant="caption"
        sx={{
          color: liked ? '#e91e63' : 'rgba(0,0,0,0.5)',
          fontWeight: liked ? 700 : 400,
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
          minWidth: 14,
        }}
      >
        {count > 0 ? count : ''}
      </Typography>
    </Box>
  );
}
