import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { apiDevServer } from './server/dev-api.js';

export default defineConfig(({ mode }) => {
  // Make .env values available to the /api handlers during `npm run dev`.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [k, v] of Object.entries(env)) if (!(k in process.env)) process.env[k] = v;

  return {
    plugins: [react(), apiDevServer()],
  };
});
