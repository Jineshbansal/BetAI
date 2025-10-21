/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        accent: "#06d6a0",
      },
      boxShadow: {
        glow: "0 0 30px rgba(6, 214, 160, 0.3)",
      },
    },
  },
  plugins: [],
};
