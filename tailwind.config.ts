/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // CATMS Brand Tokens
        brand: {
          primary: "#16A085",
          dark: "#0F7A66",
          deep: "#0B1220",
        },
        // App background
        app: "#F7F8FA",
        surface: "#FFFFFF",
        // Status colors
        success: {
          DEFAULT: "#16A34A",
          bg: "#E9F9EF",
        },
        danger: {
          DEFAULT: "#DC2626",
          bg: "#FDECEC",
        },
        warning: {
          DEFAULT: "#D97706",
          bg: "#FFF4E5",
        },
        info: {
          DEFAULT: "#2563EB",
          bg: "#EAF1FE",
        },
        purple: {
          DEFAULT: "#7C3AED",
          bg: "#F3ECFE",
        },
        // Text colors
        "text-primary": "#101828",
        "text-secondary": "#475467",
        "text-muted": "#98A2B3",
        "border-subtle": "#EAECEF",
        // Shadcn/Radix color system
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
        "2xl": "16px",
        "3xl": "20px",
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        sidebar: "1px 0 0 #EAECEF",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
