/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stellar: {
          blue: '#0070f3',
          dark: '#1a1a1a',
          gray: '#666666',
        },
      },
    },
  },
  plugins: [],
}