"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

interface ParticleOverlayProps {
  particles: Particle[];
}

export default function ParticleOverlay({ particles }: ParticleOverlayProps) {
  return (
    // AnimatePresence allows particles to finish their "exit" animation
    // even after they are removed from the state array.
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0.5, x: p.x, y: p.y }}
          animate={{
            opacity: 0,
            y: p.y - 200, // Rise upwards
            x: p.x + (Math.random() - 0.5) * 150, // Drift slightly left or right
            rotate: Math.random() * 80 - 40, // Random rotation for "floaty" feel
            scale: 1.5, // Grow slightly as it disappears
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
          }}
          style={{
            position: "fixed", // Fixed positioning ensures it ignores parent scrolling
            left: 0,
            top: 0,
            fontSize: "2.5rem",
            pointerEvents: "none", // Critical: prevents particles from blocking clicks
            zIndex: 9999,
            filter: "drop-shadow(0 0 10px rgba(255,255,255,0.4))",
            userSelect: "none",
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
