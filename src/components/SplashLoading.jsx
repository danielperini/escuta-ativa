import React from 'react';
import { motion } from 'framer-motion';

const LOGO_URL = 'https://media.base44.com/images/public/693acc814baf8083c262896b/ad8b6ee33_ChatGPTImage15desetde202600_10_59.png';

export default function SplashLoading({ label = 'Carregando' }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Halo pulsante atrás da logo */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 240,
          height: 240,
          background:
            'radial-gradient(circle, rgba(241,110,69,0.28) 0%, rgba(22,95,114,0.18) 40%, transparent 70%)',
          filter: 'blur(24px)',
        }}
        animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.18, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Anel girando ao redor */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 200,
          height: 200,
          border: '1.5px solid rgba(241,110,69,0.35)',
          borderTopColor: 'rgba(22,95,114,0.9)',
          borderRightColor: 'rgba(241,110,69,0.9)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      {/* Logo com fade-in + respiração */}
      <motion.img
        src={LOGO_URL}
        alt="Scambio.ia"
        className="relative z-10 h-40 w-auto object-contain md:h-48"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: [1, 1.04, 1] }}
        transition={{
          opacity: { duration: 0.8, ease: 'easeOut' },
          scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Rótulo "Carregando" com pontos animados */}
      <motion.div
        className="relative z-10 mt-8 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.25em] uppercase text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <span>{label}</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block w-1.5 h-1.5 rounded-full bg-[#f16e45]"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
    </div>
  );
}