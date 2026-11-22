import { useState } from 'react';

export default function InfoTooltip({
  text,
  title,
  align = 'center',
  position = 'top',
  className = '',
}) {
  const [show, setShow] = useState(false);

  // Vertical placement
  const positionClasses = position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';

  // Horizontal alignment relative to the (i) icon
  let alignClasses = 'left-1/2 -translate-x-1/2';
  let arrowClasses = 'left-1/2 -translate-x-1/2';
  if (align === 'left') {
    alignClasses = 'left-0';
    arrowClasses = 'left-2.5';
  } else if (align === 'right') {
    alignClasses = 'right-0';
    arrowClasses = 'right-2.5';
  }

  return (
    <span
      className={`relative inline-flex items-center justify-center cursor-help select-none ${className}`}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      aria-label={title ? `${title} info` : 'Info'}
    >
      <span className="w-3.5 h-3.5 rounded-full border border-orange-300 text-orange-600 hover:border-orange-500 hover:text-orange-700 hover:bg-orange-100 flex items-center justify-center text-[10px] font-serif font-bold italic transition-colors leading-none shadow-2xs">
        i
      </span>

      {show && (
        <span
          role="tooltip"
          className={`
            absolute z-50 ${positionClasses} ${alignClasses}
            w-60 p-2.5 rounded-lg bg-white text-stone-800 text-[11px] font-normal leading-relaxed
            border border-orange-300 shadow-xl shadow-orange-950/15 pointer-events-none text-left
          `}
        >
          {title && (
            <span className="block font-bold text-orange-950 text-xs mb-1">
              {title}
            </span>
          )}
          <span>{text}</span>

          {/* Border-arrow pointing to the (i) badge */}
          {position === 'top' ? (
            <span
              className={`absolute top-full ${arrowClasses} -mt-px border-4 border-transparent border-t-white`}
            />
          ) : (
            <span
              className={`absolute bottom-full ${arrowClasses} -mb-px border-4 border-transparent border-b-white`}
            />
          )}
        </span>
      )}
    </span>
  );
}
