import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        dossiers: resolve(__dirname, 'dossiers.html'),
        protocol: resolve(__dirname, 'protocol.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
	allowedHosts: [
      'melinda-uninoculable-squabblingly.ngrok-free.dev'
    ],
  },
});
