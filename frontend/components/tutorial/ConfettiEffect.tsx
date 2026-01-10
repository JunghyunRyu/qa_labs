"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
  duration?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#ffeaa7",
  "#dfe6e9",
  "#a29bfe",
  "#fd79a8",
  "#00b894",
  "#e17055",
];

/**
 * ConfettiEffect - 튜토리얼 완료 시 축하 효과
 *
 * Canvas 기반 컨페티 애니메이션을 표시합니다.
 */
export default function ConfettiEffect({
  trigger,
  onComplete,
  duration = 3000,
}: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  const createParticles = useCallback(() => {
    const particles: Particle[] = [];
    const particleCount = 150;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }

    return particles;
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      let activeParticles = 0;
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // Gravity
        particle.rotation += particle.rotationSpeed;

        // Fade out
        if (progress > 0.5) {
          particle.opacity = Math.max(0, 1 - (progress - 0.5) * 2);
        }

        // Check if particle is still visible
        if (
          particle.y < canvas.height + 50 &&
          particle.opacity > 0 &&
          particle.x > -50 &&
          particle.x < canvas.width + 50
        ) {
          activeParticles++;

          // Draw particle
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);
          ctx.globalAlpha = particle.opacity;
          ctx.fillStyle = particle.color;

          // Draw rectangle confetti
          ctx.fillRect(
            -particle.size / 2,
            -particle.size / 4,
            particle.size,
            particle.size / 2
          );

          ctx.restore();
        }
      });

      // Continue animation if there are active particles and not expired
      if (activeParticles > 0 && progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    },
    [duration, onComplete]
  );

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    particlesRef.current = createParticles();
    startTimeRef.current = performance.now();

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, animate, createParticles]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      aria-hidden="true"
    />
  );
}
