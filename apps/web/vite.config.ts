import { resolve } from 'node:path'; import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],publicDir:resolve(__dirname,'../../public'),server:{port:3000,open:true,allowedHosts:['melinda-uninoculable-squabblingly.ngrok-free.dev']},build:{outDir:'dist',emptyOutDir:true}});
