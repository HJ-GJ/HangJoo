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

assert(posts.length >= 14, `Expected at least 14 posts, got ${posts.length}`);
assert(indexHtml.includes('--canvas: #FFFEF2'), 'index.html must include Warm Editorial token --canvas: #FFFEF2');
assert(indexHtml.includes('zine-cover'), 'index.html must use Book-Cover / Zine Shelf layout (.zine-cover)');

const requiredCategories = ['Python', 'NumPy', 'Pandas', 'Data & ML', 'Deep Learning', 'Project ASCEND'];
const presentCategories = new Set(posts.map((p) => p.category));
for (const cat of requiredCategories) {
  assert(presentCategories.has(cat), `Missing required category in posts.json: ${cat}`);
}

for (const post of posts) {
  const postFile = path.join(ROOT, 'posts', `${post.slug}.html`);
  assert(fs.existsSync(postFile), `Missing built post file: posts/${post.slug}.html`);
  const html = fs.readFileSync(postFile, 'utf8');
  const escapedTitle = post.title.replace(/&/g, '&amp;');
  assert(html.includes(escapedTitle), `Post HTML missing title: ${post.title}`);
  assert(html.includes('finding-box'), `Post HTML missing .finding-box (최종적으로 내가 알아낸 내용): ${post.slug}.html`);
  assert(!/<text[^>]*>(?:(?!<\/text>)[\s\S])*?<span/i.test(html), `Forbidden <span> inside SVG <text> in ${post.slug}.html`);
}

console.log(`PASS: Verified index.html and ${posts.length} article pages across ${requiredCategories.length} categories with Warm Editorial tokens & Zine Shelf UI.`);
