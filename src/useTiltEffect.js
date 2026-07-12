import { useEffect } from 'react';

// Applies a real perspective/rotate 3D tilt to any element with the
// `tilt-card` class as the pointer moves over it. Uses event delegation so
// it keeps working even if cards are re-rendered (e.g. profile data refresh).
export default function useTiltEffect() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const MAX_TILT_DEG = 7;
    let activeCard = null;

    const resetCard = (card) => {
      card.style.transform = '';
      card.style.removeProperty('--glow-x');
      card.style.removeProperty('--glow-y');
    };

    const handlePointerMove = (event) => {
      const card = event.target.closest('.tilt-card');

      if (card !== activeCard) {
        if (activeCard) resetCard(activeCard);
        activeCard = card;
      }

      if (!card) return;

      const rect = card.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width;
      const relativeY = (event.clientY - rect.top) / rect.height;
      const rotateY = (relativeX - 0.5) * (MAX_TILT_DEG * 2);
      const rotateX = (0.5 - relativeY) * (MAX_TILT_DEG * 2);

      card.style.transform = `perspective(950px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) translateZ(8px)`;
      card.style.setProperty('--glow-x', `${relativeX * 100}%`);
      card.style.setProperty('--glow-y', `${relativeY * 100}%`);
    };

    const handlePointerLeaveWindow = () => {
      if (activeCard) {
        resetCard(activeCard);
        activeCard = null;
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeaveWindow);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeaveWindow);
      if (activeCard) resetCard(activeCard);
    };
  }, []);
}
