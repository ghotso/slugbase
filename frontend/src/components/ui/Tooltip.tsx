import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      // Use requestAnimationFrame to ensure tooltip is rendered before calculating position
      requestAnimationFrame(() => {
        if (!triggerRef.current || !tooltipRef.current) return;
        
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = triggerRect.top + scrollY - tooltipRect.height - 8;
            left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
            break;
          case 'bottom':
            top = triggerRect.bottom + scrollY + 8;
            left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
            break;
          case 'left':
            top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
            left = triggerRect.left + scrollX - tooltipRect.width - 8;
            break;
          case 'right':
            top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
            left = triggerRect.right + scrollX + 8;
            break;
        }

        // Keep tooltip within viewport
        const padding = 8;
        if (top < scrollY + padding) top = scrollY + padding;
        if (left < scrollX + padding) left = scrollX + padding;
        if (left + tooltipRect.width > scrollX + window.innerWidth - padding) {
          left = scrollX + window.innerWidth - tooltipRect.width - padding;
        }

        setTooltipPosition({ top, left });
      });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const clonedChild = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  });

  return (
    <>
      <span ref={triggerRef as any} className="inline-block">
        {clonedChild}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 ${
              position === 'top'
                ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
                : position === 'bottom'
                ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
                : position === 'left'
                ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
                : 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
            }`}
          />
        </div>
      )}
    </>
  );
}
