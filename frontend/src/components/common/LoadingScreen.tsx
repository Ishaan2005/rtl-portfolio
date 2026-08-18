import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  durationSeconds?: number;
}

const VLSI_PUNS = [
  "Hold on, resolving metastability in the clock tree...",
  "Why did the flip-flop go to therapy? It couldn't handle the setup and hold stress!",
  "Routing power straps: Please watch your step on VDD and VSS!",
  "Synthesizing logic gates... Don't worry, 0 latches were inferred!",
  "Why do VLSI engineers love coffee? Because it reduces propagation delay!",
  "Checking DRC rules: Clean layout in progress, 0 antenna violations found!",
  "Calculating timing margins: Good things come to those who wait for the positive clock edge.",
  "Biasing CMOS transistors and locking the PLL for silicon tapeout..."
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  durationSeconds = 7,
}) => {
  const [punIndex, setPunIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, durationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [durationSeconds, onComplete]);

  // Rotate puns every 1.4 seconds
  useEffect(() => {
    const punInterval = setInterval(() => {
      setPunIndex((prev) => (prev + 1) % VLSI_PUNS.length);
    }, 1400);

    return () => clearInterval(punInterval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Fullscreen Looping GIF */}
      <img
        src="/loading.gif"
        alt="Loading..."
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          backgroundColor: '#000000',
        }}
      />

      {/* Floating Clean VLSI Pun Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          padding: '12px 24px',
          maxWidth: '85%',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 800,
            color: '#ffffff',
            fontFamily: '"Times New Roman", Times, serif',
            letterSpacing: '0.3px',
            lineHeight: '22px',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
          }}
        >
          {VLSI_PUNS[punIndex]}
        </span>
      </div>
    </div>
  );
};
