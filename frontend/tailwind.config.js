/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        serif: ["'Noto Serif'", "Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
        heading: ["'Noto Serif'", "Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1.1rem' }],
        'xs': ['0.85rem', { lineHeight: '1.25rem' }],
        'sm': ['0.95rem', { lineHeight: '1.45rem' }],
        'base': ['1.0625rem', { lineHeight: '1.65rem' }],
        'lg': ['1.2rem', { lineHeight: '1.75rem' }],
        'xl': ['1.35rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.65rem', { lineHeight: '2.1rem' }],
        '3xl': ['2rem', { lineHeight: '2.4rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.8rem' }],
        '5xl': ['3.25rem', { lineHeight: '1.15' }],
      },
      colors: {
        brand: {
          primary: "#4F46E5", // Indigo 600
          primaryLight: "#6366F1", // Indigo 500
          secondary: "#10B981", // Emerald 500
          accent: "#F59E0B", // Amber 500
          offwhite: "#F8FAFC", // Slate 50
          surface: "#FFFFFF",
          navy: "#0F172A",
        },
        navy: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
          lighter: "#334155",
        },
        cream: {
          DEFAULT: "#F8FAFC", // modern off-white
          card: "#FFFFFF",
        },
        gold: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          soft: "#FEF3C7",
        },
        forest: {
          DEFAULT: "#10B981", // emerald
          light: "#34D399",
          dark: "#059669",
        },
        dept: {
          eng: "#F59E0B",
          snt: "#3B82F6",
          trd: "#8B5CF6",
          merged: "#10B981",
        },
        severity: {
          critical: "#EF4444",
          criticalBg: "#FEE2E2",
          major: "#F59E0B",
          majorBg: "#FEF3C7",
          minor: "#64748B",
          minorBg: "#F1F5F9",
        },
        risk: {
          low: "#10B981",
          moderate: "#F59E0B",
          high: "#F97316",
          critical: "#EF4444",
        },
      },
      boxShadow: {
        card: "0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.01)",
        soft: "0 4px 15px rgba(0, 0, 0, 0.03)",
        glow: "0 0 20px rgba(79, 70, 229, 0.3)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}
