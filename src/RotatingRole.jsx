import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Splits "Data Analyst | BI Developer | Web Application Builder" into
// separate phrases and rotates through them, like a typewriter cycling
// between titles.
export default function RotatingRole({ text, interval = 2600 }) {
  const phrases = String(text)
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, interval);
    return () => clearInterval(id);
  }, [phrases.length, interval]);

  if (!phrases.length) return null;

  return (
    <span className="rotating-role">
      <AnimatePresence mode="wait">
        <motion.span
          key={phrases[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
