import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_URL } from "@/config/site";

// SEC-5: fonts are self-hosted (latin subsets from Google Fonts, SIL OFL 1.1, licences in app/fonts/),
// so the build never fetches from Google. Both are variable fonts; the weight ranges match what we use.
const figtree = localFont({ src: "./fonts/Figtree-latin-variable.woff2", weight: "300 900", variable: "--font-figtree" });
const outfit = localFont({ src: "./fonts/Outfit-latin-variable.woff2", weight: "500 700", variable: "--font-outfit" });

// SHOW-2: the root layout carries only the document and fonts. The showcase (app/(site)) and the
// gated demo (app/demo) each load their own styles, so the demo's full-screen CSS never reaches
// the scrolling showcase. Links between the two are plain <a> tags (full page loads).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
