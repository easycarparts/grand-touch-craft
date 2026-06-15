import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "0.75rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(38 92% 58% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(38 92% 58% / 0.6)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "guided-tap-badge": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.78" },
        },
        "guided-attention": {
          "0%": {
            transform: "translateY(6px) scale(0.99)",
            opacity: "0.6",
            boxShadow: "0 0 0 0 rgba(247, 181, 43, 0)",
          },
          "40%": {
            transform: "translateY(-2px) scale(1.012)",
            opacity: "1",
            boxShadow: "0 18px 42px rgba(247, 181, 43, 0.22)",
          },
          "100%": {
            transform: "translateY(0) scale(1)",
            opacity: "1",
            boxShadow: "0 0 24px rgba(247, 181, 43, 0.12)",
          },
        },
        "guided-caret-blink": {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "1" },
        },
        "guided-free-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(247, 181, 43, 0.45)",
          },
          "60%": {
            boxShadow: "0 0 0 12px rgba(247, 181, 43, 0)",
          },
        },
        "guided-sparkle-twinkle": {
          "0%, 100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
          "50%": { transform: "scale(1.18) rotate(15deg)", opacity: "0.85" },
        },
        "guided-reveal-row": {
          "0%": {
            opacity: "0",
            transform: "translateY(8px)",
            backgroundColor: "rgba(247, 181, 43, 0)",
          },
          "20%": {
            opacity: "1",
            transform: "translateY(0)",
            backgroundColor: "rgba(247, 181, 43, 0.22)",
          },
          "55%": {
            backgroundColor: "rgba(247, 181, 43, 0.22)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
            backgroundColor: "rgba(247, 181, 43, 0)",
          },
        },
        "guided-reveal-check": {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "40%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "guided-strike": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "25%": { opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
        "guided-price-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.9)" },
          "60%": { opacity: "1", transform: "translateY(0) scale(1.05)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "guided-anchor-up": {
          "0%": { opacity: "0", transform: "translateY(6px) scale(1.18)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "guided-cue-pulse": {
          "0%, 100%": {
            boxShadow: "0 12px 34px rgba(247, 181, 43, 0.32), 0 0 0 0 rgba(247, 181, 43, 0.0)",
          },
          "50%": {
            boxShadow: "0 12px 34px rgba(247, 181, 43, 0.32), 0 0 0 6px rgba(247, 181, 43, 0.22)",
          },
        },
        "guided-marquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "guided-panel-flash": {
          "0%, 100%": {
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.42), 0 0 0 0 rgba(247,181,43,0)",
            borderColor: "rgba(255,255,255,0.10)",
          },
          "25%": {
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.42), 0 0 0 6px rgba(247,181,43,0.45), 0 0 60px rgba(247,181,43,0.45)",
            borderColor: "rgba(247,181,43,0.9)",
          },
          "55%": {
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.42), 0 0 0 3px rgba(247,181,43,0.18), 0 0 30px rgba(247,181,43,0.22)",
            borderColor: "rgba(247,181,43,0.55)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.3s ease-out",
        "accordion-up": "accordion-up 0.3s ease-out",
        "fade-up": "fade-up 0.6s ease-out",
        "fade-in": "fade-in 0.8s ease-out",
        "shimmer": "shimmer 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "slide-in": "slide-in 0.5s ease-out",
        "guided-tap-badge": "guided-tap-badge 4.5s ease-in-out infinite",
        "guided-attention": "guided-attention 1.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "guided-caret-blink": "guided-caret-blink 1s steps(2, end) infinite",
        "guided-free-pulse": "guided-free-pulse 2.4s ease-out infinite",
        "guided-sparkle-twinkle": "guided-sparkle-twinkle 2.2s ease-in-out infinite",
        "guided-reveal-row": "guided-reveal-row 1.6s ease-out both",
        "guided-reveal-check": "guided-reveal-check 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "guided-strike": "guided-strike 0.55s cubic-bezier(0.65, 0, 0.35, 1) both",
        "guided-price-in": "guided-price-in 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "guided-anchor-up": "guided-anchor-up 0.45s ease-out both",
        "guided-cue-pulse": "guided-cue-pulse 2.2s ease-in-out infinite",
        "guided-marquee": "guided-marquee 38s linear infinite",
        "guided-panel-flash": "guided-panel-flash 1.4s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
