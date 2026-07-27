import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';

// Animates "6+" -> counts 0 to 6 then keeps the "+", "2025" -> counts up to
// 2025, etc. Anything without a leading number just renders as-is.
export default function CountUp({ value, duration = 1.4 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const match = String(value).match(/^(\d+)(.*)$/);
  const numericTarget = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';
  const [display, setDisplay] = useState(numericTarget === null ? String(value) : '0');

  useEffect(() => {
    if (!inView || numericTarget === null) return undefined;
    const controls = animate(0, numericTarget, {
      duration,
      ease: 'easeOut',
      onUpdate(latest) {
        setDisplay(Math.round(latest).toString());
      },
    });
    return () => controls.stop();
  }, [inView, numericTarget, duration]);

  return (
    <span ref={ref}>
      {numericTarget === null ? value : `${display}${suffix}`}
    </span>
  );
}
