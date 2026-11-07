/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B5BD6',
          50: '#F2F2FC',
          100: '#E5E5FA',
          200: '#CECEF5',
          300: '#A9A9ED',
          400: '#7E7EE3',
          500: '#5B5BD6',
          600: '#4A4AC7',
          700: '#3D3DB0',
          800: '#33338E',
          900: '#2C2C73',
          light: '#EEF0FD',
        },
        accent: {
          DEFAULT: '#20B8A6',
          50: '#F0FDFB',
          100: '#CCFBF4',
          200: '#99F6E7',
          300: '#5EEAD7',
          400: '#2DD4BF',
          500: '#20B8A6',
          600: '#179B8C',
          700: '#157D72',
          800: '#15635C',
          900: '#15524C',
          light: '#E6F8F5',
        },
        priority: {
          urgent: '#EF4444',
          high: '#F97316',
          medium: '#F59E0B',
          low: '#3B82F6',
        },
        canvas: {
          light: '#F8FAFC',
          dark: '#0B0F19',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#151D2F',
        },
        borderLight: '#E2E8F0',
        borderDark: '#243049',
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04)',
        'elevated': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 40px -10px rgba(15, 23, 42, 0.16), 0 1px 3px 0 rgba(15, 23, 42, 0.05)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
