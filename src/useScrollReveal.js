import { useEffect } from 'react';

// Fades + rotates `.reveal` elements into place the first time they enter
// the viewport while scrolling.
export default function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return undefined;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('in-view'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
}
