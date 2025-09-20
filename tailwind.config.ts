import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",  // <-- строка, не ["class"]
  // В v4 пропускать content можно. Но можно и оставить — не мешает.
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#25D366", foreground: "#ffffff" },
        accent: "#202C33",
      },
      backgroundImage: {
        "wa-pattern": "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
export default config
