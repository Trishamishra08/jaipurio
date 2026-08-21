/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      xs: '390px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        mitti: {
          ivory: '#F8F1E3',
          beige: '#E8D4B5',
          terracotta: '#A94E2C',
          deepTerracotta: '#873A24',
          maroon: '#6F241D',
          sage: '#82977A',
          forest: '#354B35',
          gold: '#C69A45',
          brown: '#4A3A2F',
          dark: '#2B1E1A',
          cream: '#FCF8F2'
        },
        brand: {
          light: '#F8F1E3',
          dark: '#4A3A2F',
          gold: '#C69A45',
          primary: '#A94E2C',
          maroon: '#6F241D',
          forest: '#354B35',
          sage: '#82977A'
        }
      },
      fontFamily: {
        /* Brand / headings — splash + heritage identity */
        brand: ['Cormorant Garamond', 'Georgia', 'serif'],
        heading: ['Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        tagline: ['Cormorant Garamond', 'Georgia', 'serif'],
        playfair: ['Playfair Display', 'Georgia', 'serif'],
        /* UI / e-commerce usability */
        body: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        dm: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'folk': '0 4px 20px -2px rgba(111, 36, 29, 0.08)',
        'folk-lg': '0 10px 30px -4px rgba(111, 36, 29, 0.12)',
      }
    },
  },
  plugins: [],
}
