import type { Metadata } from "next";
import { DM_Mono, Sora } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getConfig } from "@/lib/content";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const config = getConfig();

export const metadata: Metadata = {
  // Canonical public URL (incl. the Pages subpath) — the base against which the
  // og:image / twitter:image URLs below are resolved to absolute so social
  // crawlers can fetch them. Sourced from config so it moves with a domain change.
  metadataBase: new URL(config.site.url),
  title: {
    default: config.site.title,
    template: `%s · ${config.site.title}`,
  },
  description: config.site.description,
  // og:image / twitter:image point at a static public/og.png (served with a
  // real .png extension so GitHub Pages sends image/png; regenerate by
  // editing this file's metadata or replacing the PNG).
  openGraph: {
    type: "website",
    siteName: config.site.title,
    title: config.site.title,
    description: config.site.description,
    url: config.site.url,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${config.site.title} — weekly delivery tracker`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: config.site.title,
    description: config.site.description,
    images: ["/og.png"],
  },
};

// Applies the saved (or OS) theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteHeader />
        {/* Flex column so a page can fill the space between header and footer;
            ordinary pages just flow their content and leave the footer at the
            bottom. */}
        <main className="flex flex-1 flex-col min-h-0">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
