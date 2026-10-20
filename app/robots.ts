import type { MetadataRoute } from "next";

// SHOW-3: the showcase is indexable; the gated demo, the access page and the API are not.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/demo", "/access", "/api"] } };
}
