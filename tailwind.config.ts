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
        // WhatsApp Green
        'whatsapp-green': '#d9fdd3', // для моих сообщений
        'whatsapp-dark-green': '#075e54', // для фона чата или акцентов (по желанию)
        // WhatsApp Light Grey/White for others
        'whatsapp-light': '#ffffff', // для сообщений собеседника
      },
      backgroundImage: {
        "wa-pattern": "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
export default config
