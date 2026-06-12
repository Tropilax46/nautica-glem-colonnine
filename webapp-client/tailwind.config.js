/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glem: {
          50:  "#eaf3f7",
          100: "#d2e6ef",
          500: "#0b4f6c",
          600: "#094158",
          700: "#063748",
        },
      },
    },
  },
  plugins: [],
};
