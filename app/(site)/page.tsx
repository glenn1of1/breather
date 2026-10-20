import type { Metadata } from "next";
import { Showcase } from "@/components/showcase/showcase";
import { showcase } from "@/content/showcase";

// SHOW-1, SHOW-3: the public, indexable landing page. The Open Graph image is opengraph-image.tsx.
export const metadata: Metadata = {
  title: showcase.meta.title,
  description: showcase.meta.description,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Breather",
    title: showcase.meta.title,
    description: showcase.meta.description,
    locale: "en_CA",
  },
  twitter: { card: "summary_large_image", title: showcase.meta.title, description: showcase.meta.description },
};

export default function Page() {
  return <Showcase />;
}
