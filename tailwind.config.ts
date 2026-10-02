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
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Spline Sans Mono', 'monospace'],
      },
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        "2xl": "1rem",       // 16px — Apple default
        "3xl": "1.25rem",    // 20px — for large cards
        xl:    "var(--radius)",
        lg:    "calc(var(--radius) - 2px)",
        md:    "calc(var(--radius) - 4px)",
        sm:    "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        /* Apple-style elevation tiers */
        "card":     "0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)",
        "card-md":  "0 2px 8px rgba(0,0,0,0.06), 0 4px 20px rgba(0,0,0,0.04)",
        "card-lg":  "0 4px 24px rgba(0,0,0,0.08), 0 8px 40px rgba(0,0,0,0.04)",
        "glass":    "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.80)",
        "glass-dark": "0 4px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04)",
        "btn":      "0 2px 8px rgba(0,0,0,0.14)",
        "btn-dark": "0 2px 8px rgba(255,255,255,0.10)",
      },
      backdropBlur: {
        "xs": "4px",
        "xl": "24px",
        "2xl": "40px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "shimmer":        "shimmer 1.8s infinite linear",
        "fade-in":        "fade-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
