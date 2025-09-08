// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // LID green (tuned from logo)
        lid: {
          DEFAULT: "#8DC63F",
          50: "#F1F9E3",
          100: "#E3F2C7",
          200: "#C8E691",
          300: "#ACDA5B",
          400: "#97CF3B",
          500: "#8DC63F",
          600: "#6EA22F",
          700: "#567F26",
          800: "#3E5B1C",
          900: "#274712",
        },
      },
    },
  },
  plugins: [],
};
