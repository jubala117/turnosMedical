/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./kiosco.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#00529B',
        'medical-light': '#E8F4F8',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
