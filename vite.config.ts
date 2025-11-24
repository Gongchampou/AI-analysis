import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for compatibility with your existing code
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    customLogger: {
      info: () => {}, // Suppress info messages (like HMR updates)
      warn: console.warn, // Keep warnings
      error: console.error, // Keep errors
      clearScreen: () => false,
      hasErrorLogged: () => false,
      hasWarned: false,
      warnOnce: console.warn,
    },
  };
});