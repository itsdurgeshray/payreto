/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
          body: ['"DM Sans"', 'system-ui', 'sans-serif'],
          heading: ['"DM Sans"', 'system-ui', 'sans-serif'],
          display: ['"DM Sans"', 'system-ui', 'sans-serif'],
          label: ['"DM Sans"', 'system-ui', 'sans-serif'],
          serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        },
      },
    },
    plugins: [],
  }