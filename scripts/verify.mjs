import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const indexHtmlPath = path.join(ROOT, 'index.html');
const postsJsonPath = path.join(ROOT, 'posts.json');

assert(fs.existsSync(indexHtmlPath), 'index.html must exist');
assert(fs.existsSync(postsJsonPath), 'posts.json must exist');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));

assert(posts.length >= 4, `Expected at least 4 posts, got ${posts.length}`);
assert(indexHtml.includes('--canvas: #FFFEF2'), 'index.html must include Warm Editorial token --canvas: #FFFEF2');
assert(indexHtml.includes('zine-cover'), 'index.html must use Book-Cover / Zine Shelf layout (.zine-cover)');

for (const post of posts) {
  const postFile = path.join(ROOT, 'posts', `${post.slug}.html`);
  assert(fs.existsSync(postFile), `Missing built post file: posts/${post.slug}.html`);
  const html = fs.readFileSync(postFile, 'utf8');
  const escapedTitle = post.title.replace(/&/g, '&amp;');
  assert(html.includes(escapedTitle), `Post HTML missing title: ${post.title}`);
  assert(!/<text[^>]*>(?:(?!<\/text>)[\s\S])*?<span/i.test(html), `Forbidden <span> inside SVG <text> in ${post.slug}.html`);
}

console.log(`PASS: Verified index.html and ${posts.length} article pages with Warm Editorial tokens & Zine Shelf UI.`);
