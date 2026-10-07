/**
 * SEO Utilities - Sitemap, Robots, Meta Tags, Structured Data
 * 
 * Implements SEO best practices for ivo Electronics:
 * - Dynamic sitemap generation
 * - Robots.txt management
 * - Meta tag generation
 * - Structured data (JSON-LD)
 * - Canonical URLs
 */

import { db } from '../db';
import { products, categories } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================
// SITEMAP GENERATION
// ============================================

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate sitemap for all public pages
 */
export async function generateSitemap(): Promise<string> {
  const baseUrl = process.env.SITE_URL || 'https://ivo.example.com';
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push({
    loc: baseUrl,
    changefreq: 'daily',
    priority: 1.0,
  });

  urls.push({
    loc: `${baseUrl}/products`,
    changefreq: 'daily',
    priority: 0.9,
  });

  urls.push({
    loc: `${baseUrl}/about`,
    changefreq: 'monthly',
    priority: 0.5,
  });

  urls.push({
    loc: `${baseUrl}/contact`,
    changefreq: 'monthly',
    priority: 0.5,
  });

  urls.push({
    loc: `${baseUrl}/terms`,
    changefreq: 'yearly',
    priority: 0.3,
  });

  urls.push({
    loc: `${baseUrl}/privacy`,
    changefreq: 'yearly',
    priority: 0.3,
  });

  // Fetch active categories
  const activeCategories = await db
    .select({
      slug: categories.slug,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .where(eq(categories.isVisible, true));

  for (const category of activeCategories) {
    urls.push({
      loc: `${baseUrl}/categories/${category.slug}`,
      lastmod: category.updatedAt?.toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 0.8,
    });
  }

  // Fetch active products
  const activeProducts = await db
    .select({
      slug: products.slug,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        eq(products.status, 'active')
      )
    );

  for (const product of activeProducts) {
    urls.push({
      loc: `${baseUrl}/products/${product.slug}`,
      lastmod: product.updatedAt?.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  }

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
}

// ============================================
// ROBOTS.TXT
// ============================================

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(): string {
  const baseUrl = process.env.SITE_URL || 'https://ivo.example.com';
  
  return `# Robots.txt for ivo Electronics
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /checkout
Disallow: /account
Disallow: /cart
Disallow: /internal

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay (optional, be nice to servers)
Crawl-delay: 1
`;
}

// ============================================
// META TAGS
// ============================================

export interface MetaTags {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

/**
 * Generate meta tags for a page
 */
export function generateMetaTags(tags: MetaTags): string {
  const metaTags: string[] = [];

  // Basic meta tags
  metaTags.push(`<title>${escapeHtml(tags.title)}</title>`);
  metaTags.push(`<meta name="description" content="${escapeHtml(tags.description)}" />`);
  
  if (tags.keywords && tags.keywords.length > 0) {
    metaTags.push(`<meta name="keywords" content="${escapeHtml(tags.keywords.join(', '))}" />`);
  }

  if (tags.canonical) {
    metaTags.push(`<link rel="canonical" href="${tags.canonical}" />`);
  }

  // Open Graph tags
  if (tags.ogTitle || tags.title) {
    metaTags.push(`<meta property="og:title" content="${escapeHtml(tags.ogTitle || tags.title)}" />`);
  }
  
  if (tags.ogDescription || tags.description) {
    metaTags.push(`<meta property="og:description" content="${escapeHtml(tags.ogDescription || tags.description)}" />`);
  }
  
  if (tags.ogImage) {
    metaTags.push(`<meta property="og:image" content="${tags.ogImage}" />`);
  }
  
  if (tags.ogUrl || tags.canonical) {
    metaTags.push(`<meta property="og:url" content="${tags.ogUrl || tags.canonical}" />`);
  }
  
  if (tags.ogType) {
    metaTags.push(`<meta property="og:type" content="${tags.ogType}" />`);
  } else {
    metaTags.push(`<meta property="og:type" content="website" />`);
  }

  // Twitter Card tags
  if (tags.twitterCard) {
    metaTags.push(`<meta name="twitter:card" content="${tags.twitterCard}" />`);
  }
  
  if (tags.twitterTitle || tags.ogTitle || tags.title) {
    metaTags.push(`<meta name="twitter:title" content="${escapeHtml(tags.twitterTitle || tags.ogTitle || tags.title)}" />`);
  }
  
  if (tags.twitterDescription || tags.ogDescription || tags.description) {
    metaTags.push(`<meta name="twitter:description" content="${escapeHtml(tags.twitterDescription || tags.ogDescription || tags.description)}" />`);
  }
  
  if (tags.twitterImage || tags.ogImage) {
    metaTags.push(`<meta name="twitter:image" content="${tags.twitterImage || tags.ogImage}" />`);
  }

  return metaTags.join('\n    ');
}

/**
 * Generate meta tags for a product page
 */
export function generateProductMetaTags(product: any): MetaTags {
  const baseUrl = process.env.SITE_URL || 'https://ivo.example.com';
  
  return {
    title: `${product.name} - ivo Electronics`,
    description: product.shortDescription || product.description?.substring(0, 160) || `Buy ${product.name} at ivo Electronics. High-quality electronics with fast delivery in Ghana.`,
    keywords: [product.name, product.brand, product.category, 'electronics', 'ghana'].filter(Boolean),
    canonical: `${baseUrl}/products/${product.slug}`,
    ogTitle: product.name,
    ogDescription: product.shortDescription || product.description?.substring(0, 200),
    ogImage: product.imageUrl,
    ogUrl: `${baseUrl}/products/${product.slug}`,
    ogType: 'product',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generate meta tags for a category page
 */
export function generateCategoryMetaTags(category: any): MetaTags {
  const baseUrl = process.env.SITE_URL || 'https://ivo.example.com';
  
  return {
    title: `${category.name} - ivo Electronics`,
    description: category.description || `Browse our ${category.name} collection at ivo Electronics. High-quality electronics with fast delivery in Ghana.`,
    keywords: [category.name, 'electronics', 'ghana'].filter(Boolean),
    canonical: `${baseUrl}/categories/${category.slug}`,
    ogTitle: category.name,
    ogDescription: category.description,
    ogUrl: `${baseUrl}/categories/${category.slug}`,
    ogType: 'website',
    twitterCard: 'summary',
  };
}

// ============================================
// STRUCTURED DATA (JSON-LD)
// ============================================

/**
 * Generate structured data for a product
 */
export function generateProductStructuredData(product: any): object {
  const baseUrl = process.env.SITE_URL || 'https://ivo.example.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'ivo',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: product.currency || 'GHS',
      price: product.price,
      availability: product.stockQuantity > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewsCount || 0,
    } : undefined,
  };
}

/**
 * Generate structured data for the organization
 */
export function generateOrganizationStructuredData(): object {
  const baseUrl = process.env.SITE_URL || 'https://ivo.example.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ivo Electronics',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+233-XXX-XXX-XXX',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
    sameAs: [
      // Add social media links here
    ],
  };
}

/**
 * Generate structured data for breadcrumbs
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const baseUrl = process.env.SITE_URL || 'https://ivo.example.com';
  return `${baseUrl}${path}`;
}

/**
 * Check if URL is canonical (no trailing slash, no query params, etc.)
 */
export function isCanonicalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Remove trailing slash
    if (parsed.pathname.endsWith('/') && parsed.pathname !== '/') {
      return false;
    }
    // Check for query parameters (except allowed ones)
    if (parsed.search && !parsed.search.includes('page=')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
