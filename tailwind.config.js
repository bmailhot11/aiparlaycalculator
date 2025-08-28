/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      colors: {
        primary: '#1e40af',
        'primary-dark': '#1e3a8a',
        secondary: '#7c3aed',
        accent: '#f59e0b',
        // Premium theme colors (CSS variables)
        'premium': {
          'ink': 'var(--ink)',
          'panel': 'var(--panel)',
          'panel-80': 'var(--panel-80)',
          'border': 'var(--border)',
          'text-primary': 'var(--text-primary)',
          'text-muted': 'var(--text-muted)',
          'accent': 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'accent-pressed': 'var(--accent-pressed)',
          'teal': 'var(--teal)',
          'focus': 'var(--focus)',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '1240': '77.5rem',
      },
      borderRadius: {
        'premium-sm': 'var(--r-sm)',
        'premium-md': 'var(--r-md)',
        'premium-lg': 'var(--r-lg)',
      },
      boxShadow: {
        'premium-1': 'var(--shadow-1)',
        'premium-2': 'var(--shadow-2)',
      },
      backdropBlur: {
        'premium': '16px',
      }
    },
  },
  plugins: [],
}