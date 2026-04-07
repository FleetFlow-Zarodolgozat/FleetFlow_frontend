import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'https://fleetflow-zarodolgozat-backend-ressdominik.jcloud.jedlik.cloud',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
