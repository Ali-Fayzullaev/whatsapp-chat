// src/app/layout.tsx
import "./globals.css"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // 1) НЕ ставим className="dark" и НЕ ставим style на html
    // 2) suppressHydrationWarning убирает ворнинг, пока next-themes подставляет класс
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* 
          attribute="class" — next-themes будет вешать .dark на <html>
          defaultTheme="dark" — по умолчанию тёмная
          enableSystem={false} — отключаем «системную» тему, чтобы не было расхождений
          disableTransitionOnChange — без миганий при переключении
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
