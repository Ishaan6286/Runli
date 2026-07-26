const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://runli.vercel.app';
const currentDate = new Date().toISOString().split('T')[0];

// Public indexable routes with priority and change frequency
const publicRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/today', priority: '0.8', changefreq: 'daily' },
  { path: '/progress', priority: '0.8', changefreq: 'daily' },
  { path: '/plan', priority: '0.8', changefreq: 'weekly' },
  { path: '/gym', priority: '0.8', changefreq: 'weekly' },
  { path: '/profile', priority: '0.7', changefreq: 'monthly' },
  { path: '/wellness', priority: '0.8', changefreq: 'daily' },
  { path: '/coach', priority: '0.8', changefreq: 'daily' },
  { path: '/bmi', priority: '0.8', changefreq: 'monthly' },
  { path: '/diet-plan', priority: '0.7', changefreq: 'weekly' },
  { path: '/gym-mode', priority: '0.7', changefreq: 'weekly' },
  { path: '/habits', priority: '0.7', changefreq: 'weekly' },
  { path: '/videos', priority: '0.7', changefreq: 'weekly' },
  { path: '/eat', priority: '0.7', changefreq: 'weekly' },
  { path: '/train', priority: '0.7', changefreq: 'weekly' },
  { path: '/upgrade', priority: '0.6', changefreq: 'monthly' },
  { path: '/billing', priority: '0.6', changefreq: 'monthly' }
];

function generateSitemap() {
  const urls = publicRoutes
    .map(
      (route) => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join('\n');

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemapContent, 'utf8');
  console.log(`[SEO] Sitemap successfully generated at ${outputPath}`);
}

generateSitemap();
