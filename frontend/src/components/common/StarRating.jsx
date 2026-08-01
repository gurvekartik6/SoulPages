import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

export function StarRating({ value = 0, onChange, readOnly = false, size = 'h-5 w-5' }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onClick={() => !readOnly && onChange?.(star === value ? null : star)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-transform ${
            !readOnly && 'hover:scale-110'
          }`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <FiStar
            className={`${size} ${
              star <= display ? 'fill-brass text-brass-deep' : 'fill-transparent text-line'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
