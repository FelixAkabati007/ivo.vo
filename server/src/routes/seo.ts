/**
 * SEO Routes - Sitemap, Robots.txt, and SEO endpoints
 */

import { Hono } from 'hono';
import { generateSitemap, generateRobotsTxt } from '../seo';

export const seoRouter = new Hono();

/**
 * GET /sitemap.xml
 * Generate dynamic sitemap for search engines
 */
seoRouter.get('/sitemap.xml', async (c) => {
  try {
    const sitemap = await generateSitemap();
    
    return c.newResponse(sitemap, 200, {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return c.json({ error: 'Failed to generate sitemap' }, 500);
  }
});

/**
 * GET /robots.txt
 * Serve robots.txt to control crawler access
 */
seoRouter.get('/robots.txt', (c) => {
  try {
    const robotsTxt = generateRobotsTxt();
    
    return c.newResponse(robotsTxt, 200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    return c.json({ error: 'Failed to generate robots.txt' }, 500);
  }
});

/**
 * GET /manifest.json
 * Progressive Web App manifest
 */
seoRouter.get('/manifest.json', (c) => {
  const manifest = {
    name: 'ivo Electronics',
    short_name: 'ivo',
    description: 'Premium electronics store in Ghana',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a1a1a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
  
  return c.json(manifest);
});
