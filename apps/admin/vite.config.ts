import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    port: 3001,
    host: true,
    allowedHosts: ['melinda-uninoculable-squabblingly.ngrok-free.dev'],
  },
});
