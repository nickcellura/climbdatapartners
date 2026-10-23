import {access} from 'node:fs/promises';
for (const file of ['index.html','styles.css','app.js','config.js','privacy.html','terms.html','favicon.svg','social.svg','social.png','robots.txt','sitemap.xml','_headers','_routes.json']) await access(new URL(`../public/${file}`,import.meta.url));
console.log('Static site validated. Deploy public/ with the root functions/ directory using Cloudflare Pages.');
