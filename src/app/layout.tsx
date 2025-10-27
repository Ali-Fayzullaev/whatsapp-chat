import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthenticatedApp } from "@/components/AuthenticatedApp";
import { ToastProvider } from "@/components/ui/toast";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <WebSocketProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <ToastProvider>
                <AuthenticatedApp>
                  {children}
                </AuthenticatedApp>
              </ToastProvider>
            </ThemeProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
