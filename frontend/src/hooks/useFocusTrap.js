import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap – Traps keyboard focus inside a container element.
 *
 * Features:
 * - Tab / Shift+Tab cycles within the container
 * - Escape key calls onClose
 * - Auto-focuses first focusable element on mount
 * - Restores focus to previously active element on unmount
 *
 * Usage:
 *   const trapRef = useFocusTrap(isOpen, onClose);
 *   <div ref={trapRef}> ... </div>
 */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(isActive, onClose) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (!containerRef.current) return;

      // Escape → close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      // Tab trap
      if (e.key === 'Tab') {
        const focusable = containerRef.current.querySelectorAll(FOCUSABLE);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isActive) return;

    // Save currently focused element
    previouslyFocused.current = document.activeElement;

    // Auto-focus first focusable element inside container
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const first = containerRef.current.querySelector(FOCUSABLE);
        if (first) first.focus();
      }
    }, 50); // small delay for animation mount

    // Listen for keydown
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        previouslyFocused.current.focus();
      }
    };
  }, [isActive, handleKeyDown]);

  return containerRef;
}
