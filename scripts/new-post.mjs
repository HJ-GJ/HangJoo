import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const draftsDir = path.join(root, 'content', 'drafts');
const postsDir = path.join(root, 'content', 'posts');
const templatesDir = path.join(root, 'content', 'templates');

const rawTitle = (process.argv[2] || '새 학습 기록').trim();
const category = (process.argv[3] || 'Python').trim();
const project = /^Project /i.test(category);
const templateName = project ? 'project-post.md' : 'study-post.md';
const title = rawTitle.replace(/^\[[^\]]+\]\s*-\s*/, '').replace(/[\r\n"]/g, ' ').trim();
const safeCategory = category.replace(/[\r\n"]/g, ' ').trim();
const today = new Date().toISOString().slice(0, 10);

function getExistingIssues(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.md'))
    .map(name => fs.readFileSync(path.join(dir, name), 'utf8').match(/^issue:\s*["']?NO\.\s*(\d+)/m))
    .filter(Boolean)
    .map(match => Number(match[1]));
}
const nextNumber = Math.max(0, ...getExistingIssues(postsDir), ...getExistingIssues(draftsDir)) + 1;
const number = String(nextNumber).padStart(2, '0');
const slug = title.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').trim()
  .replace(/\s+/g, '-').slice(0, 48) || 'note';
const filename = `${today}-edition-${number}-${slug}.md`;
const target = path.join(draftsDir, filename);

fs.mkdirSync(draftsDir, { recursive: true });
if (fs.existsSync(target)) throw new Error(`Draft already exists: ${filename}`);

const template = fs.readFileSync(path.join(templatesDir, templateName), 'utf8');
const substitutions = { NUMBER: number, TITLE: title, CATEGORY: safeCategory, DATE: today };
const result = template.replace(/\{\{(NUMBER|TITLE|CATEGORY|DATE)\}\}/g, (_, key) => substitutions[key]);
fs.writeFileSync(target, result, { encoding: 'utf8', flag: 'wx' });

console.log(`Created REVIEW-ONLY draft: content/drafts/${filename}`);
console.log('Drafts are not built/published automatically. Review the editorial checklist before publication.');
