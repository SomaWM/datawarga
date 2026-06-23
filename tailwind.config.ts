import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tema warna utama (dipetakan dari CSS lama)
        hijau: {
          DEFAULT: '#1a6b3c',
          muda: '#2d9657',
          terang: '#4aba7a',
          pekat: '#0f4a28',
        },
        kuning: {
          DEFAULT: '#f5a623',
          muda: '#ffd166',
        },
        merah: '#e63946',
        biru: {
          DEFAULT: '#1d6fa4',
          muda: '#4da3d4',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['var(--font-noto)', 'Noto Serif', 'serif'],
      },
      boxShadow: {
        kartu: '0 4px 24px rgba(0,0,0,0.08)',
        besar: '0 10px 40px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
