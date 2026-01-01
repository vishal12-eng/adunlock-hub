import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SITE_NAME = 'ADNEXUS';
const DEFAULT_DESCRIPTION = 'Unlock premium content by watching a few ads. Fast, secure, and no sign-up required.';
const DEFAULT_IMAGE = 'https://adnexus.app/og-image.png';
const SITE_URL = 'https://adnexus.app';

export function useSEO(config: SEOConfig = {}) {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    noindex = false,
    keywords = [],
    author = SITE_NAME,
    publishedTime,
    modifiedTime,
  } = config;

  useEffect(() => {
    // Update document title
    const fullTitle = title 
      ? `${title} | ${SITE_NAME}` 
      : `${SITE_NAME} - Watch Ads. Unlock Content.`;
    document.title = fullTitle;

    // Update meta description
    updateMetaTag('description', description);
    
    // Update robots
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    
    // Update keywords
    if (keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '));
    }
    
    // Update author
    updateMetaTag('author', author);

    // Update Open Graph tags
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', SITE_NAME, 'property');
    
    if (url) {
      updateMetaTag('og:url', `${SITE_URL}${url}`, 'property');
      updateLinkTag('canonical', `${SITE_URL}${url}`);
    }

    // Update Twitter tags
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Article specific tags
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('article:published_time', publishedTime, 'property');
      }
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime, 'property');
      }
    }

    // Cleanup function to reset to defaults
    return () => {
      document.title = `${SITE_NAME} - Watch Ads. Unlock Content.`;
    };
  }, [title, description, image, url, type, noindex, keywords, author, publishedTime, modifiedTime]);
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
}

// Generate JSON-LD structured data for content
export function generateContentSchema(content: {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  views?: number;
  unlocks?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: content.title,
    description: content.description || `Unlock "${content.title}" by watching a few ads.`,
    image: content.thumbnailUrl || DEFAULT_IMAGE,
    url: `${SITE_URL}/unlock/${content.id}`,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: content.views || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/DownloadAction',
        userInteractionCount: content.unlocks || 0,
      },
    ],
    isAccessibleForFree: false,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Watch ads to unlock',
    },
  };
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

// Generate FAQ schema
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
