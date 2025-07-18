import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/stellar-hackathon/' : '/',
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  server: {
    https: false,
    host: true
  }
});