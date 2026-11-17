import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '..', 'content', 'posts');

const titleArg = process.argv[2] || '새 개발 및 학습 기록';
const categoryArg = process.argv[3] || 'Project ASCEND';

const existing = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
const nextNum = String(existing.length + 1).padStart(2, '0');
const today = new Date().toISOString().slice(0, 10);

const slugTitle = titleArg
  .toLowerCase()
  .replace(/[^a-z0-9가-힣\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .slice(0, 48);

const filename = `${today}-edition-${nextNum}-${slugTitle || 'note'}.md`;
const targetPath = path.join(CONTENT_DIR, filename);

const template = `---
issue: "NO. ${nextNum}"
title: "${titleArg}"
date: "${today}"
category: "${categoryArg}"
readTime: "5분"
tags: ["Architecture", "Note"]
summary: "이 글에서 다루는 핵심 문제와 해결 원리를 한두 문장으로 요약합니다."
coverType: "editorial-grid"
takeaway: "독자가 기억해야 할 가장 중요한 설계 결론을 한 줄로 정리합니다."
---

## 1. 문제 배경과 핵심 질문

다루고자 하는 문제 상황이나 이론적 질문을 간결하게 정의합니다.

:::compare
### 기존 접근 방식
- 한계 조건 요약 1
- 한계 조건 요약 2
---
### 개선된 설계
- 핵심 해결 원리 1
- 핵심 해결 원리 2
:::

## 2. 핵심 구현 및 검증 코드

\`\`\`kotlin
// title: Example.kt — 핵심 동작 검증 코드
// takeaway: 실행 결과에서 확인해야 할 핵심 포인트를 적습니다.
// 핵심: 가장 중요한 불변식이나 계산 규칙을 주석으로 강조합니다.
fun verifyInvariants(): Boolean {
    return true
}
\`\`\`
`;

fs.writeFileSync(targetPath, template, 'utf8');
console.log(`Created new post template: content/posts/${filename}`);
