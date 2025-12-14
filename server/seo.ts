const DOMAIN = process.env.FRONTEND_URL || "https://adnexus.app";
const SITE_NAME = "ADNEXUS";
const DEFAULT_DESCRIPTION = "Unlock premium content by watching a few ads. Fast, secure, and no sign-up required. Download exclusive files, APKs, and more.";
const DEFAULT_IMAGE = `${DOMAIN}/og-image.png`;

interface SEOOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
}

export function truncateTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3).trim() + "...";
}

export function truncateDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength - 3).trim() + "...";
}

export function generateCanonicalUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${DOMAIN}${cleanPath}`;
}

export function generateSEOMeta(options: SEOOptions = {}) {
  const {
    title = `${SITE_NAME} - Watch Ads. Unlock Content.`,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    image = DEFAULT_IMAGE,
    noindex = false,
    type = "website",
  } = options;

  const truncatedTitle = truncateTitle(title);
  const truncatedDescription = truncateDescription(description);
  const canonicalUrl = generateCanonicalUrl(path);

  return {
    title: truncatedTitle,
    description: truncatedDescription,
    canonical: canonicalUrl,
    robots: noindex ? "noindex, nofollow" : "index, follow",
    openGraph: {
      title: truncatedTitle,
      description: truncatedDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      image: image,
      type: type,
    },
    twitter: {
      card: "summary_large_image",
      title: truncatedTitle,
      description: truncatedDescription,
      image: image,
    },
  };
}

export function generateContentSEO(content: {
  title: string;
  description?: string | null;
  id: string;
}) {
  const title = `${content.title} - Unlock on ${SITE_NAME}`;
  const description = content.description || `Unlock "${content.title}" by watching a few ads. Fast, secure download.`;

  return generateSEOMeta({
    title,
    description,
    path: `/unlock/${content.id}`,
    type: "article",
  });
}

export function isPrivateRoute(path: string): boolean {
  const privatePaths = [
    "/admin",
    "/panel",
    "/panel-adnexus-9f3x",
    "/api/admin",
  ];

  return privatePaths.some(p => path.startsWith(p));
}

export function generateJSONLD() {
  return {
    website: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": DOMAIN,
      "description": DEFAULT_DESCRIPTION,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${DOMAIN}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": SITE_NAME,
      "url": DOMAIN,
      "logo": `${DOMAIN}/favicon.ico`,
      "sameAs": []
    },
    softwareApplication: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": SITE_NAME,
      "applicationCategory": "Utility",
      "operatingSystem": "Web",
      "description": DEFAULT_DESCRIPTION,
      "url": DOMAIN,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  };
}

export { DOMAIN, SITE_NAME, DEFAULT_DESCRIPTION };
