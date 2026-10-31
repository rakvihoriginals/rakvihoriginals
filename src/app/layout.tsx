import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAKVIH Originals | Luxury Maison & Editions",
  description: "The premier destination for handcrafted luxury handbags, footwear, eyewear, and signature accessories.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "48x48" },
      { url: "/icon-512.png?v=2", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: [
      { url: "/apple-touch-icon.png?v=2" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("rakvih_intro_seen")==="1")document.documentElement.classList.add("rk-intro-seen")}catch(e){}`,
          }}
        />
        <link rel="preload" as="image" href="/rakvih-logo-mark.png" />
        <link rel="preload" as="image" href="/rakvih-logo-originals.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://wneonnqavtbwziybbxaq.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://wneonnqavtbwziybbxaq.supabase.co" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

