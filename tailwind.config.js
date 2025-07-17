/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'primary': '#4A90E2',        // A clear, friendly blue
        'secondary': '#F5F7FA',     // A very light gray for backgrounds
        'accent': '#50E3C2',         // A vibrant accent color for highlights
        'text-primary': '#333333',   // Dark gray for primary text
        'text-secondary': '#555555', // Lighter gray for secondary text
        'border-color': '#D1D5DB',  // A light gray for borders
        'error': '#D9534F',          // A standard red for errors
        'success': '#5CB85C',        // A standard green for success
        'warning': '#F0AD4E',        // A standard yellow for warnings
      },
    },
  },
  plugins: [],
}