/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#18212f",
        line: "#d9e1ea",
        brand: "#2563eb",
        mint: "#0f9f7a",
        coral: "#e85d4f"
      }
    }
  },
  plugins: []
};
