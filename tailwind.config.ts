/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Big Shoulders', 'sans-serif'],
        mono: ['var(--font-mono)', 'Spline Sans Mono', 'monospace'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        paper: {
          DEFAULT: '#F4F0EA',
          muted: '#EDE6DC',
          dark: '#E2D7C7',
          fold: '#D9CDBB',
        },
        ink: {
          DEFAULT: '#24201D',
          body: '#3D3834',
          mute: '#706860',
          rule: '#8E857C',
          hairline: '#C8C0B5',
        },
        vermilion: {
          DEFAULT: '#D9381E',
          deep: '#B82C15',
          dark: '#93220F',
          light: '#FBEBE8',
        },
        teal: {
          DEFAULT: '#2A7B88',
          deep: '#1E5E69',
          light: '#EAF4F5',
        },
        forest: {
          DEFAULT: '#276738',
          deep: '#1D4E2A',
          light: '#EAF5EC',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "tape-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "tape-scroll": "tape-scroll 32s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
