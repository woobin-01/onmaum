import type { Metadata, Viewport } from "next";
import AppChrome from "@/components/AppChrome";
import { LivingOrbProvider } from "@/components/LivingOrbProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "온마음",
  description: "얼굴 표정 기반 일별 마음 상태 모니터링",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "온마음",
  },
};

export const viewport: Viewport = {
  themeColor: "#6BAB9A",
  width: "device-width",
  initialScale: 1,
};

// FOUC 방지 — body 마운트 전에 data-theme 속성을 지정해 다크 토큰이 즉시 적용되도록.
// useTheme 의 storage key/auto 시간대 분기와 동일해야 함 (lib 와 동기화).
const themeInitScript = `
(function(){
  try {
    var saved = localStorage.getItem('onmaum_theme') || 'auto';
    var resolved = saved;
    if (saved === 'auto') {
      var h = new Date().getHours();
      resolved = (h >= 6 && h < 18) ? 'light' : 'dark';
    }
    document.documentElement.dataset.theme = resolved;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--bg-base)] text-[var(--fg)]">
        <ThemeProvider>
          <LivingOrbProvider>
            <AppChrome>{children}</AppChrome>
          </LivingOrbProvider>
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
