'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';

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

  const iconSize = size === 'small' ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]';

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleLike}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all duration-200',
          size === 'small' ? 'h-8 w-8' : 'h-9 w-9',
          liked
            ? 'text-[#e91e63] hover:text-[#c2185b]'
            : 'text-black/40 hover:text-[#e91e63]',
          'hover:bg-[#e91e63]/[0.08]',
          animating && 'scale-[1.3]'
        )}
        type="button"
        aria-label={liked ? 'Descurtir' : 'Curtir'}
      >
        <Heart
          className={cn(iconSize, liked && 'fill-current')}
        />
      </button>
      <span
        className={cn(
          'min-w-[14px]',
          size === 'small' ? 'text-[0.7rem]' : 'text-[0.8rem]',
          liked ? 'text-[#e91e63] font-bold' : 'text-black/50 font-normal'
        )}
      >
        {count > 0 ? count : ''}
      </span>
    </div>
  );
}
