const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://runli.vercel.app';
const currentDate = new Date().toISOString().split('T')[0];

// Only publicly accessible pages that return HTTP 200 without authentication
const publicRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/bmi', priority: '0.8', changefreq: 'monthly' }
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
