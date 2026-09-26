import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createGeminiMiddleware } from './server/geminiProxy.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'gemini-proxy',
        configureServer(server) {
          server.middlewares.use('/api/gemini/generate-question', createGeminiMiddleware(env));
        }
      }
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true
        }
      }
    }
  };
});
