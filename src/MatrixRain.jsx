import { useEffect, useRef } from "react";
import "./MatrixRain.css";

// Data-analyst themed characters: SQL keywords, symbols, numbers
const CHARS =
  "SELECT FROM WHERE GROUP BY ORDER HAVING JOIN SQL 0123456789 ΣπΔ∑∫ ABCDEFabcdef <>()[]{}|/\\#@$%&*";

const CHAR_ARRAY = CHARS.split("");

export default function MatrixRain({
  height = 400,         // height of canvas in px
  opacity = 0.18,       // 0.1 (very subtle) to 0.4 (strong)
  speed = 1.2,          // 1 = normal, 2 = fast
  fontSize = 13,
  color = "#00ff88",    // matrix green — change to your accent color
  backgroundColor = "rgba(0,0,0,0)", // transparent default
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    let animId;
    let drops = [];
    let isVisible = true;

    function init() {
      canvas.width = canvas.offsetWidth;
      canvas.height = height;
      const cols = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }

    function draw() {
      if (!isVisible) {
        animId = requestAnimationFrame(draw);
        return;
      }

      // Fade trail
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      drops.forEach((y, i) => {
        // Random char from data-analyst set
        const char = CHAR_ARRAY[Math.floor(Math.random() * CHAR_ARRAY.length)];
        const x = i * fontSize;

        // Lead char is bright white, rest is the accent color
        const isLead = y * fontSize >= 0 && Math.random() > 0.95;
        ctx.fillStyle = isLead ? "#ffffff" : color;
        ctx.globalAlpha = opacity + Math.random() * 0.08;
        ctx.fillText(char, x, y * fontSize);
        ctx.globalAlpha = 1;

        // Reset drop randomly after it falls off screen
        if (y * fontSize > canvas.height && Math.random() > 0.975 - speed * 0.01) {
          drops[i] = 0;
        }
        drops[i] += speed * 0.4;
      });

      animId = requestAnimationFrame(draw);
    }

    // Debounced resize
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animId);
        init();
        draw();
      }, 200);
    };

    // Pause the render loop while the canvas is scrolled off-screen, so it
    // doesn't burn CPU/battery on mobile when it isn't even visible.
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    init();
    draw();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [height, opacity, speed, fontSize, color]);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain-canvas"
      style={{ height: `${height}px`, background: backgroundColor }}
    />
  );
}
