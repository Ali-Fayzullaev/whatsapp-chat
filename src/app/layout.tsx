import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { WebSocketProvider } from "@/providers/WebSocketProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <WebSocketProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}
