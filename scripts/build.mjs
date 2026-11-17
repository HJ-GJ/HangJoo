import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'posts');
const POSTS_OUT_DIR = path.join(ROOT, 'posts');

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Missing frontmatter block (--- ... ---)');
  }
  const [, fmText, body] = match;
  const meta = {};
  for (const line of fmText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        meta[key] = JSON.parse(val);
      } catch {
        meta[key] = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }
    } else {
      meta[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { meta, body: body.trim() };
}

function formatInline(text) {
  let out = escapeHtml(text);
  // Inline math $...$ -> <span class="math-formula">...</span>
  out = out.replace(/\$([^$]+)\$/g, (_, expr) => {
    const formatted = expr
      .replace(/\\tanh/g, 'tanh')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\odot/g, '⊙')
      .replace(/\\approx/g, '≈')
      .replace(/\\tilde\{C\}_t/g, 'C̃<sub>t</sub>')
      .replace(/([A-Za-z])_\{([^}]+)\}/g, '<span class="math-sym">$1</span><sub>$2</sub>')
      .replace(/([A-Za-z])_([A-Za-z0-9]+)/g, '<span class="math-sym">$1</span><sub>$2</sub>');
    return `<span class="math-formula">${formatted}</span>`;
  });
  // Inline code `...`
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold **...**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

function highlightCode(rawCode) {
  const lines = rawCode.split(/\r?\n/);
  let codeTitle = '실습 및 검증 코드';
  let codeTakeaway = '';
  const bodyLines = [];

  for (const line of lines) {
    const titleMatch = line.match(/^(?:\/\/|#|\/\*)\s*title:\s*(.+?)(?:\*\/)?$/);
    if (titleMatch) {
      codeTitle = titleMatch[1].trim();
      continue;
    }
    const takeawayMatch = line.match(/^(?:\/\/|#|\/\*)\s*takeaway:\s*(.+?)(?:\*\/)?$/);
    if (takeawayMatch) {
      codeTakeaway = takeawayMatch[1].trim();
      continue;
    }
    bodyLines.push(line);
  }

  const renderedLines = bodyLines.map((line) => {
    const escaped = escapeHtml(line);
    if (/^\s*(?:\/\/|#|\/\*)\s*핵심:/.test(line)) {
      return `<span class="code-critical">${escaped}</span>`;
    }
    if (/^\s*(?:\/\/|#|\/\*|--)/.test(line)) {
      return `<span class="code-comment">${escaped}</span>`;
    }
    return escaped;
  });

  return {
    codeTitle,
    codeTakeaway,
    htmlCode: renderedLines.join('\n'),
  };
}

function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let currentSection = null;
  let i = 0;

  function ensureSection() {
    if (!currentSection) {
      currentSection = {
        id: 'intro',
        title: null,
        blocks: [],
      };
      sections.push(currentSection);
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    // Section Heading ##
    if (line.startsWith('## ')) {
      const titleText = line.slice(3).trim();
      const id = `sec-${sections.length + 1}`;
      currentSection = { id, title: titleText, blocks: [] };
      sections.push(currentSection);
      i++;
      continue;
    }

    // Compare block :::compare
    if (line.trim() === ':::compare') {
      ensureSection();
      i++;
      const compareLines = [];
      while (i < lines.length && lines[i].trim() !== ':::') {
        compareLines.push(lines[i]);
        i++;
      }
      i++; // skip closing :::
      const parts = compareLines.join('\n').split(/\n---\n/);
      const colsHtml = parts
        .map((part) => {
          const pLines = part.trim().split(/\r?\n/);
          let colTitle = '';
          const items = [];
          for (const pl of pLines) {
            if (pl.startsWith('### ')) {
              colTitle = pl.slice(4).trim();
            } else if (pl.startsWith('- ')) {
              items.push(`<li>${formatInline(pl.slice(2).trim())}</li>`);
            }
          }
          return `<div><h3>${escapeHtml(colTitle)}</h3><ul>${items.join('')}</ul></div>`;
        })
        .join('');
      currentSection.blocks.push(`<div class="compare">${colsHtml}</div>`);
      continue;
    }

    // Formula block :::formula
    if (line.trim() === ':::formula') {
      ensureSection();
      i++;
      const fRows = [];
      while (i < lines.length && lines[i].trim() !== ':::') {
        const rawRow = lines[i].trim();
        if (rawRow) {
          const [fname, fcell, fdesc] = rawRow.split('|').map((s) => s.trim());
          fRows.push(`
            <div class="formula-line">
              <div class="fname">${escapeHtml(fname || '')}</div>
              <div class="formula-cell">${escapeHtml(fcell || '')}</div>
              <div class="formula-desc">${formatInline(fdesc || '')}</div>
            </div>
          `);
        }
        i++;
      }
      i++; // skip closing :::
      currentSection.blocks.push(`<div class="formula-table">${fRows.join('')}</div>`);
      continue;
    }

    // Finding block :::finding
    if (line.trim() === ':::finding') {
      ensureSection();
      i++;
      let findingTitle = '최종적으로 내가 알아낸 내용 (Key Findings)';
      const findingItems = [];
      while (i < lines.length && lines[i].trim() !== ':::') {
        const fl = lines[i].trim();
        if (fl.startsWith('### ')) {
          findingTitle = fl.slice(4).trim();
        } else if (fl.startsWith('- ')) {
          findingItems.push(`<li>${formatInline(fl.slice(2).trim())}</li>`);
        } else if (fl) {
          findingItems.push(`<li>${formatInline(fl)}</li>`);
        }
        i++;
      }
      i++; // skip closing :::
      currentSection.blocks.push(`
        <div class="finding-box">
          <div class="finding-head">
            <span class="finding-badge">MY KEY FINDINGS</span>
            <strong>${escapeHtml(findingTitle)}</strong>
          </div>
          <ul class="finding-list">${findingItems.join('')}</ul>
        </div>
      `);
      continue;
    }

    // Code block ```
    if (line.trim().startsWith('```')) {
      ensureSection();
      const lang = line.trim().slice(3).trim() || 'code';
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const { codeTitle, codeTakeaway, htmlCode } = highlightCode(codeLines.join('\n'));
      const takeawayHtml = codeTakeaway
        ? `<div class="practice-takeaway"><b>기억할 핵심 · ${escapeHtml(lang.toUpperCase())}</b><div>${formatInline(codeTakeaway)}</div></div>`
        : '';
      currentSection.blocks.push(`
        <div class="code">
          <details class="practice-code" open>
            <summary>
              <span class="practice-tag">실습 코드</span>
              <span class="practice-name">${escapeHtml(codeTitle)}</span>
              <span class="practice-toggle"><span class="practice-closed-word">눌러서 보기</span><span class="practice-open-word">접기</span></span>
              <span class="practice-chevron" aria-hidden="true"></span>
            </summary>
            <pre><code>${htmlCode}</code></pre>
            ${takeawayHtml}
          </details>
        </div>
      `);
      continue;
    }

    // Unordered list
    if (line.startsWith('- ')) {
      ensureSection();
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(`<li>${formatInline(lines[i].slice(2).trim())}</li>`);
        i++;
      }
      currentSection.blocks.push(`<ul class="ed-list">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      ensureSection();
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${formatInline(lines[i].replace(/^\d+\.\s+/, '').trim())}</li>`);
        i++;
      }
      currentSection.blocks.push(`<ol class="ed-list">${items.join('')}</ol>`);
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    ensureSection();
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('## ') &&
      !lines[i].startsWith(':::') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].startsWith('- ') &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    currentSection.blocks.push(`<p>${formatInline(paraLines.join(' '))}</p>`);
  }

  return sections;
}

function getCoverSvg(coverType, category) {
  switch (coverType) {
    case 'python-day1':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Python Day 1 입출력과 조건문 도식">
        <rect width="320" height="200" fill="#EDF2EB"/>
        <rect x="24" y="42" width="114" height="50" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <text x="81" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">input().split()</text>
        <text x="81" y="81" text-anchor="middle" font-size="10" fill="#5A5A51">map(int, ...)</text>
        <line x1="138" y1="67" x2="176" y2="67" stroke="#285E4F" stroke-width="2"/>
        <rect x="176" y="42" width="120" height="50" rx="6" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="236" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="#6D5B39">몫(//) · 나머지(%)</text>
        <text x="236" y="81" text-anchor="middle" font-size="10" fill="#5A5A51">시간 · 자릿수 분해</text>
        <rect x="52" y="114" width="216" height="48" rx="6" fill="#FFFEF7" stroke="#333333" stroke-width="1.6"/>
        <text x="160" y="136" text-anchor="middle" font-size="11" font-weight="700" fill="#333333">if 특수조건 → elif 일반조건 → else</text>
        <text x="160" y="152" text-anchor="middle" font-size="10" fill="#5A5A51">윤년 · 삼각형 · 야간 소음 판정</text>
      </svg>`;
    case 'python-day2':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Python Day 2 리스트 슬라이싱과 팰린드롬 도식">
        <rect width="320" height="200" fill="#F4F2E5"/>
        <rect x="28" y="42" width="264" height="52" rx="6" fill="#FFFEF7" stroke="#BBB9A8" stroke-width="1.6"/>
        <text x="160" y="64" text-anchor="middle" font-size="11.5" font-weight="700" fill="#285E4F">num = [10, 20, 30, 40, 50]</text>
        <text x="160" y="82" text-anchor="middle" font-size="10.5" font-family="monospace" fill="#5A5A51">num[:3] | num[-1] | .append() | .sort()</text>
        <rect x="44" y="114" width="232" height="50" rx="6" fill="#EDF2EB" stroke="#285E4F" stroke-width="1.8"/>
        <text x="160" y="136" text-anchor="middle" font-size="11.5" font-weight="700" fill="#285E4F">word == word[::-1]</text>
        <text x="160" y="153" text-anchor="middle" font-size="10" fill="#333333">역순 슬라이싱 팰린드롬 판별 &amp; len() 디버깅</text>
      </svg>`;
    case 'python-day3':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Python Day 3 절사평균과 시저 암호 도식">
        <rect width="320" height="200" fill="#EAE6D8"/>
        <rect x="28" y="38" width="264" height="52" rx="6" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="160" y="60" text-anchor="middle" font-size="11.5" font-weight="700" fill="#6D5B39">Trimmed Mean: sum - max - min</text>
        <text x="160" y="78" text-anchor="middle" font-size="10" fill="#5A5A51">극단값 제외 후 (n - 2)로 나누기</text>
        <rect x="28" y="108" width="264" height="54" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <text x="160" y="131" text-anchor="middle" font-size="11.5" font-weight="700" fill="#285E4F">ord(ch) + key → chr(shifted - 26)</text>
        <text x="160" y="149" text-anchor="middle" font-size="10" fill="#5A5A51">아스키 코드 시저 암호 &amp; 6×6 주사위 중첩 루프</text>
      </svg>`;
    case 'python-day4':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Python Day 4 집합 교집합과 2차원 격자 도식">
        <rect width="320" height="200" fill="#EDF2EB"/>
        <circle cx="92" cy="100" r="46" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <circle cx="144" cy="100" r="46" fill="#F4F2E5" stroke="#6D5B39" stroke-width="1.8" fill-opacity="0.75"/>
        <text x="118" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">A &amp; B</text>
        <text x="118" y="166" text-anchor="middle" font-size="10" fill="#5A5A51">set 교집합 · 로또</text>
        <rect x="208" y="54" width="84" height="84" rx="4" fill="#FFFEF7" stroke="#333333" stroke-width="1.6"/>
        <line x1="208" y1="96" x2="292" y2="96" stroke="#BBB9A8"/>
        <line x1="250" y1="54" x2="250" y2="138" stroke="#BBB9A8"/>
        <text x="229" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="#6D5B39">P</text>
        <text x="271" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">D</text>
        <text x="229" y="122" text-anchor="middle" font-size="11" font-weight="700" fill="#6D5B39">M</text>
        <text x="271" y="122" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">A</text>
        <text x="250" y="166" text-anchor="middle" font-size="10" fill="#5A5A51">chr(65 + n % 26)</text>
      </svg>`;
    case 'python-day5':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Python Day 5 색종이 겹침과 파일 입출력 도식">
        <rect width="320" height="200" fill="#F4F2E5"/>
        <rect x="34" y="44" width="84" height="56" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <rect x="68" y="68" width="84" height="68" fill="#EDF2EB" stroke="#285E4F" stroke-width="2"/>
        <text x="110" y="106" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">board[y][x]</text>
        <text x="92" y="162" text-anchor="middle" font-size="10" fill="#5A5A51">겹친 색종이 면적</text>
        <rect x="184" y="48" width="108" height="92" rx="6" fill="#FFFEF7" stroke="#333333" stroke-width="1.6"/>
        <text x="238" y="76" text-anchor="middle" font-size="11" font-weight="700" fill="#333333">words.txt</text>
        <line x1="198" y1="88" x2="278" y2="88" stroke="#BBB9A8"/>
        <text x="238" y="108" text-anchor="middle" font-size="10" font-family="monospace" fill="#285E4F">word : meaning</text>
        <text x="238" y="126" text-anchor="middle" font-size="10" fill="#5A5A51">open("r" / "w")</text>
      </svg>`;
    case 'python-day6':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Python Day 6 클래스와 BankApp 도식">
        <rect width="320" height="200" fill="#EAE6D8"/>
        <rect x="36" y="34" width="248" height="132" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <rect x="36" y="34" width="248" height="30" rx="6" fill="#285E4F"/>
        <text x="160" y="53" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FFFEF7">class BankAccount (__init__)</text>
        <text x="56" y="88" font-size="11" font-family="monospace" fill="#333333">+ owner, balance, salt</text>
        <line x1="52" y1="100" x2="268" y2="100" stroke="#DDD8C7"/>
        <text x="56" y="122" font-size="11" font-family="monospace" fill="#285E4F" font-weight="700">+ verify_password(pbkdf2)</text>
        <text x="56" y="144" font-size="11" font-family="monospace" fill="#6D5B39">+ transfer_to() &amp; JSON save</text>
      </svg>`;
    case 'numpy-basics':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NumPy 차원 구조와 브로드캐스팅 도식">
        <rect width="320" height="200" fill="#EDF2EB"/>
        <rect x="20" y="38" width="136" height="62" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <text x="88" y="60" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">0D · 1D · 2D · 3D</text>
        <text x="88" y="79" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#5A5A51">shape=(2, 3) · ndim=2</text>
        <rect x="168" y="38" width="132" height="62" rx="6" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="234" y="60" text-anchor="middle" font-size="11" font-weight="700" fill="#6D5B39">m[행, 열] 슬라이싱</text>
        <text x="234" y="79" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#5A5A51">m[1:3, 1:4] (끝 제외)</text>
        <rect x="36" y="116" width="248" height="52" rx="6" fill="#FFFEF7" stroke="#333333" stroke-width="1.6"/>
        <text x="160" y="138" text-anchor="middle" font-size="11" font-weight="700" fill="#333333">Broadcasting: arr * 2 vs list * 2</text>
        <text x="160" y="155" text-anchor="middle" font-size="10" fill="#5A5A51">반복문 없이 모든 원소에 동시 연산 (c * 9/5 + 32)</text>
      </svg>`;
    case 'numpy-matmul':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NumPy 내적 정사영과 행렬곱 좌표 변환 도식">
        <rect width="320" height="200" fill="#EAE6D8"/>
        <rect x="22" y="34" width="134" height="132" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <text x="89" y="56" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">내적 (a @ b)</text>
        <line x1="42" y1="124" x2="132" y2="124" stroke="#333333" stroke-width="2"/>
        <line x1="42" y1="124" x2="106" y2="78" stroke="#285E4F" stroke-width="2.2"/>
        <line x1="106" y1="78" x2="106" y2="124" stroke="#6D5B39" stroke-width="1.5" stroke-dasharray="3 3"/>
        <text x="89" y="148" text-anchor="middle" font-size="9.5" fill="#5A5A51">그림자 길이 × 기준 길이</text>
        <rect x="166" y="34" width="132" height="132" rx="6" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="232" y="56" text-anchor="middle" font-size="11" font-weight="700" fill="#6D5B39">행렬곱 (A @ B)</text>
        <text x="232" y="84" text-anchor="middle" font-size="10.5" font-family="monospace" fill="#333333">(m×n) @ (n×p)</text>
        <text x="232" y="104" text-anchor="middle" font-size="10.5" font-family="monospace" fill="#285E4F" font-weight="700">→ (m×p) 내적의 표</text>
        <text x="232" y="132" text-anchor="middle" font-size="9.5" fill="#5A5A51">p @ A 좌표 회전·확대 변환</text>
        <text x="232" y="149" text-anchor="middle" font-size="9.5" fill="#6D5B39">A @ B ≠ B @ A (순서 중요)</text>
      </svg>`;
    case 'pandas-intro':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pandas Series와 DataFrame 및 loc iloc 비교 도식">
        <rect width="320" height="200" fill="#F4F2E5"/>
        <rect x="24" y="34" width="132" height="132" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <rect x="24" y="34" width="132" height="26" rx="6" fill="#285E4F"/>
        <text x="90" y="51" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FFFEF7">DataFrame = Series 묶음</text>
        <text x="90" y="80" text-anchor="middle" font-size="10" font-family="monospace" fill="#333333">head() · info()</text>
        <text x="90" y="102" text-anchor="middle" font-size="10" font-family="monospace" fill="#285E4F">shape · columns</text>
        <text x="90" y="124" text-anchor="middle" font-size="10" font-family="monospace" fill="#6D5B39">describe()</text>
        <text x="90" y="149" text-anchor="middle" font-size="9.5" fill="#5A5A51">8명 학생 성적표 탐색</text>
        <rect x="166" y="34" width="130" height="132" rx="6" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="231" y="58" text-anchor="middle" font-size="11" font-weight="700" fill="#6D5B39">loc vs iloc &amp; 조건</text>
        <text x="231" y="82" text-anchor="middle" font-size="10" font-family="monospace" fill="#285E4F">loc[0:3] 끝 포함!</text>
        <text x="231" y="102" text-anchor="middle" font-size="10" font-family="monospace" fill="#333333">iloc[0:3] 끝 제외!</text>
        <line x1="180" y1="115" x2="282" y2="115" stroke="#DDD8C7"/>
        <text x="231" y="135" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#6D5B39">(조건1) &amp; (조건2)</text>
        <text x="231" y="152" text-anchor="middle" font-size="9.5" fill="#5A5A51">불리언 인덱싱 · isin()</text>
      </svg>`;
    case 'pandas-analysis':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pandas groupby 집계와 결측치 처리 및 apply 파이프라인 도식">
        <rect width="320" height="200" fill="#EDF2EB"/>
        <rect x="24" y="36" width="272" height="54" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <text x="160" y="58" text-anchor="middle" font-size="11" font-weight="700" fill="#285E4F">df.groupby('반')['수학'].agg(['mean', 'max', 'min'])</text>
        <text x="160" y="77" text-anchor="middle" font-size="10" fill="#5A5A51">sort_values() 정렬 · 그룹별 다중 통계 요약 · value_counts()</text>
        <rect x="24" y="106" width="130" height="58" rx="6" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="89" y="129" text-anchor="middle" font-size="10.5" font-weight="700" fill="#6D5B39">결측치(NaN) 방어</text>
        <text x="89" y="148" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#5A5A51">isna().sum() · fillna()</text>
        <rect x="166" y="106" width="130" height="58" rx="6" fill="#FFFEF7" stroke="#333333" stroke-width="1.8"/>
        <text x="231" y="129" text-anchor="middle" font-size="10.5" font-weight="700" fill="#333333">파생 열 &amp; apply</text>
        <text x="231" y="148" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#285E4F">df['평균'].apply(grade)</text>
      </svg>`;
    case 'data-ml':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bank Marketing 시기별 Lift 검증 도식">
        <rect width="320" height="200" fill="#F4F2E5"/>
        <rect x="32" y="36" width="256" height="128" rx="6" fill="#FFFEF7" stroke="#BBB9A8" stroke-width="1.6"/>
        <text x="52" y="64" font-size="11" font-weight="700" fill="#285E4F">전반부 Lift 1.38x</text>
        <rect x="156" y="53" width="108" height="13" rx="4" fill="#285E4F"/>
        <text x="52" y="96" font-size="11" font-weight="700" fill="#285E4F">후반부 Lift 1.33x</text>
        <rect x="156" y="85" width="102" height="13" rx="4" fill="#285E4F"/>
        <line x1="150" y1="44" x2="150" y2="112" stroke="#6D5B39" stroke-width="1.5" stroke-dasharray="3 3"/>
        <text x="160" y="142" text-anchor="middle" font-size="10.5" font-weight="700" fill="#6D5B39">Data Leakage 차단 &amp; 두 시기 일관성 검증</text>
      </svg>`;
    case 'timer-state':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="기준 시각 기반 타이머 상태머신 도식">
        <rect width="320" height="200" fill="#EDF2EB"/>
        <line x1="34" y1="100" x2="286" y2="100" stroke="#BBB9A8" stroke-width="2" stroke-dasharray="4 4"/>
        <rect x="24" y="62" width="82" height="76" rx="6" fill="#FFFEF7" stroke="#285E4F" stroke-width="1.8"/>
        <text x="65" y="94" text-anchor="middle" font-size="11.5" font-weight="700" fill="#285E4F">startedAt</text>
        <text x="65" y="114" text-anchor="middle" font-size="10.5" fill="#5A5A51">t₀ 기록</text>
        <circle cx="160" cy="100" r="25" fill="#285E4F"/>
        <text x="160" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="#FFFEF7">Δt 계산</text>
        <rect x="214" y="62" width="82" height="76" rx="6" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="255" y="94" text-anchor="middle" font-size="11.5" font-weight="700" fill="#6D5B39">COMPLETED</text>
        <text x="255" y="114" text-anchor="middle" font-size="10.5" fill="#5A5A51">오차 0 복원</text>
      </svg>`;
    case 'lstm-highway':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LSTM 셀 상태 덧셈 통로 도식">
        <rect width="320" height="200" fill="#F4F2E5"/>
        <line x1="28" y1="56" x2="292" y2="56" stroke="#285E4F" stroke-width="3"/>
        <circle cx="110" cy="56" r="14" fill="#FFFEF7" stroke="#285E4F" stroke-width="2"/>
        <text x="110" y="61" text-anchor="middle" font-size="14" font-weight="700" fill="#285E4F">×</text>
        <circle cx="210" cy="56" r="14" fill="#FFFEF7" stroke="#285E4F" stroke-width="2"/>
        <text x="210" y="61" text-anchor="middle" font-size="14" font-weight="700" fill="#285E4F">+</text>
        <rect x="82" y="110" width="56" height="36" rx="5" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.6"/>
        <text x="110" y="132" text-anchor="middle" font-size="11.5" font-weight="700" fill="#6D5B39">f_t (σ)</text>
        <rect x="182" y="110" width="56" height="36" rx="5" fill="#FFFEF7" stroke="#6D5B39" stroke-width="1.6"/>
        <text x="210" y="132" text-anchor="middle" font-size="11.5" font-weight="700" fill="#6D5B39">i_t · C̃_t</text>
        <line x1="110" y1="110" x2="110" y2="70" stroke="#6D5B39" stroke-width="1.8"/>
        <line x1="210" y1="110" x2="210" y2="70" stroke="#6D5B39" stroke-width="1.8"/>
        <text x="160" y="176" text-anchor="middle" font-size="11" font-weight="700" fill="#5A5A51">Additive Cell State Highway</text>
      </svg>`;
    case 'reward-ledger':
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="RewardLedger 멱등성 원장 도식">
        <rect width="320" height="200" fill="#EAE6D8"/>
        <rect x="38" y="32" width="244" height="136" rx="6" fill="#FFFEF7" stroke="#BBB9A8" stroke-width="1.8"/>
        <rect x="38" y="32" width="244" height="30" rx="6" fill="#285E4F"/>
        <text x="160" y="51" text-anchor="middle" font-size="11" font-weight="700" fill="#FFFEF7">REWARD_LEDGER (UNIQUE KEY)</text>
        <text x="56" y="88" font-size="11" font-family="monospace" fill="#285E4F" font-weight="700">key_01 | +50 XP | COMMIT</text>
        <line x1="52" y1="100" x2="268" y2="100" stroke="#E0DCCB" stroke-width="1"/>
        <text x="56" y="120" font-size="11" font-family="monospace" fill="#6D5B39">key_01 | +50 XP | IGNORE</text>
        <line x1="52" y1="132" x2="268" y2="132" stroke="#E0DCCB" stroke-width="1"/>
        <text x="56" y="152" font-size="11" font-family="monospace" fill="#333333">key_02 | +30 XP | COMMIT</text>
      </svg>`;
    default:
      return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(category)} 에디토리얼 커버 도식">
        <rect width="320" height="200" fill="#EFECE0"/>
        <rect x="44" y="32" width="76" height="136" rx="6" fill="#FFFEF7" stroke="#333333" stroke-width="1.8"/>
        <rect x="54" y="48" width="56" height="22" rx="3" fill="#285E4F"/>
        <rect x="54" y="78" width="56" height="48" rx="3" fill="#F4F2E5" stroke="#BBB9A8"/>
        <text x="82" y="152" text-anchor="middle" font-size="10" fill="#5A5A51">360px</text>
        <rect x="146" y="32" width="130" height="136" rx="6" fill="#FFFEF7" stroke="#333333" stroke-width="1.8"/>
        <rect x="158" y="48" width="106" height="22" rx="3" fill="#6D5B39"/>
        <rect x="158" y="78" width="50" height="52" rx="3" fill="#F4F2E5" stroke="#BBB9A8"/>
        <rect x="214" y="78" width="50" height="52" rx="3" fill="#F4F2E5" stroke="#BBB9A8"/>
        <text x="211" y="152" text-anchor="middle" font-size="10" fill="#5A5A51">820px Read</text>
      </svg>`;
  }
}

const SHARED_TOKENS_CSS = `
:root {
  --canvas: #FFFEF2;
  --paper: #FFFEF7;
  --surface: #F4F2E5;
  --ink: #333333;
  --muted: #5A5A51;
  --line: #BBB9A8;
  --blue: #6D5B39;
  --green: #285E4F;
  --purple: #756657;
  --corner: 8px;
  --read-width: 820px;
  --shelf-width: 1080px;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; color-scheme: light; }
body {
  margin: 0;
  background: var(--canvas);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
  font-size: 17px;
  line-height: 1.78;
  word-break: keep-all;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
.serif-title {
  font-family: "Georgia", "AppleMyungjo", "Nanum Myeongjo", "Batang", serif;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
}
`;

function buildArticleHtml(post, prevPost, nextPost) {
  const tocItems = post.sections
    .filter((s) => s.title)
    .map((s) => `<li><a href="#${s.id}">${escapeHtml(s.title)}</a></li>`)
    .join('');

  const sectionsHtml = post.sections
    .map((s) => {
      const heading = s.title ? `<h2>${escapeHtml(s.title)}</h2>` : '';
      return `<section id="${s.id}">${heading}${s.blocks.join('\n')}</section>`;
    })
    .join('\n');

  const accentColor = post.meta.category === 'Project ASCEND' ? 'var(--green)' : 'var(--blue)';

  const navNeighbors = `
    <nav class="edition-nav" aria-label="이전 및 다음 글 이동">
      ${
        prevPost
          ? `<a class="edition-nav-card" href="./${prevPost.slug}.html">
              <span class="mono edition-nav-dir">← PREVIOUS EDITION (${escapeHtml(prevPost.meta.issue)})</span>
              <strong>${escapeHtml(prevPost.meta.title)}</strong>
            </a>`
          : `<div class="edition-nav-card empty"><span class="mono edition-nav-dir">FIRST EDITION</span><strong>첫 번째 기록입니다</strong></div>`
      }
      ${
        nextPost
          ? `<a class="edition-nav-card right" href="./${nextPost.slug}.html">
              <span class="mono edition-nav-dir">NEXT EDITION (${escapeHtml(nextPost.meta.issue)}) →</span>
              <strong>${escapeHtml(nextPost.meta.title)}</strong>
            </a>`
          : `<div class="edition-nav-card right empty"><span class="mono edition-nav-dir">LATEST EDITION</span><strong>가장 최신 기록입니다</strong></div>`
      }
    </nav>
  `;

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(post.meta.title)} — HangJoo</title>
  <meta name="description" content="${escapeHtml(post.meta.summary)}" />
  <style>
    ${SHARED_TOKENS_CSS}
    .top-bar {
      width: min(calc(100% - 44px), var(--read-width));
      margin: 0 auto;
      padding: 28px 0 16px;
      border-bottom: 2px solid var(--line);
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .brand-link {
      font-weight: 800;
      font-size: 19px;
      letter-spacing: -0.03em;
      color: var(--ink);
    }
    .back-link {
      font-size: 14px;
      font-weight: 700;
      color: var(--green);
      padding: 6px 12px;
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: 6px;
    }
    .back-link:hover {
      border-color: var(--green);
    }
    main {
      width: min(calc(100% - 44px), var(--read-width));
      margin: 0 auto;
      padding: 36px 0 100px;
    }
    header.post-header {
      padding-bottom: 22px;
      border-bottom: 2px solid var(--line);
    }
    .post-meta {
      display: flex;
      align-items: center;
      gap: 8px 12px;
      flex-wrap: wrap;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .issue-pill {
      display: inline-block;
      padding: 2px 8px;
      background: var(--ink);
      color: var(--paper);
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
    }
    .cat-label {
      font-weight: 750;
      color: ${accentColor};
    }
    h1 {
      font-size: clamp(26px, 4vw, 37px);
      line-height: 1.32;
      letter-spacing: -0.04em;
      font-weight: 760;
      margin: 0;
    }
    .lead {
      color: var(--muted);
      font-size: 17px;
      line-height: 1.75;
      margin: 16px 0 0;
    }
    .cover-stage {
      margin: 22px 0 0;
      background: var(--paper);
      border: 1.5px solid var(--line);
      border-radius: var(--corner);
      overflow: hidden;
    }
    .cover-svg-wrap {
      max-height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .cover-svg-wrap svg {
      width: 100%;
      max-height: 240px;
      height: auto;
      display: block;
    }
    .cover-caption {
      padding: 11px 16px;
      background: var(--surface);
      border-top: 1.5px solid var(--line);
      font-size: 14px;
      color: var(--muted);
    }
    .cover-caption strong {
      color: var(--green);
    }
    .toc {
      padding: 16px 20px;
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--corner);
      margin-top: 22px;
    }
    .toc strong {
      display: block;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .toc ol {
      margin: 0;
      padding-left: 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 24px;
    }
    .toc a {
      color: var(--ink);
      font-size: 15px;
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
    }
    section {
      padding: 36px 0 28px;
      border-bottom: 2px solid var(--line);
      scroll-margin-top: 20px;
    }
    section:last-of-type {
      border-bottom: none;
    }
    h2 {
      font-size: clamp(20px, 3vw, 25px);
      line-height: 1.4;
      letter-spacing: -0.03em;
      margin: 0 0 14px;
    }
    h3 {
      font-size: 17px;
      line-height: 1.45;
      margin: 0 0 8px;
    }
    p {
      margin: 10px 0 14px;
    }
    .ed-list {
      margin: 10px 0 16px;
      padding-left: 22px;
    }
    .ed-list li {
      margin: 6px 0;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      font-size: 0.87em;
      background: var(--surface);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #DFDDD0;
    }
    pre code {
      background: none;
      padding: 0;
      border: 0;
      font-size: inherit;
    }
    .math-sym {
      font-style: italic;
      font-family: "Cambria Math", Georgia, serif;
      white-space: nowrap;
    }
    .math-formula {
      display: inline-block;
      background: var(--surface);
      padding: 1px 8px;
      border-radius: 4px;
      border: 1px solid var(--line);
      font-size: 14.5px;
      white-space: nowrap;
    }
    .compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 16px 0;
    }
    .compare > div {
      border: 1.5px solid var(--line);
      padding: 16px 18px;
      border-radius: var(--corner);
      background: var(--paper);
    }
    .compare h3 {
      font-size: 16px;
      color: var(--green);
      margin: 0 0 8px;
    }
    .compare ul {
      margin: 0;
      padding-left: 18px;
      font-size: 14.5px;
    }
    .compare li {
      margin: 5px 0;
    }
    .formula-table {
      display: grid;
      gap: 10px;
      margin: 16px 0;
    }
    .formula-line {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr) minmax(0, 1.1fr);
      gap: 8px 12px;
      align-items: center;
      background: var(--paper);
      border: 1.5px solid var(--line);
      border-radius: var(--corner);
      padding: 12px 14px;
      font-size: 14.5px;
    }
    .formula-line .fname {
      font-weight: 750;
      color: var(--green);
      font-size: 14px;
    }
    .formula-cell {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 13.5px;
      background: var(--surface);
      border: 1px solid #D1CEBE;
      border-radius: 5px;
      padding: 6px 10px;
      white-space: nowrap;
      overflow-x: auto;
    }
    .formula-desc {
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.45;
    }
    .code details.practice-code {
      padding: 0;
      overflow: hidden;
      border: 1.5px solid #7F9D8E;
      background: #F9F8F0;
      margin: 16px 0 20px;
      border-radius: var(--corner);
    }
    .code details.practice-code > summary {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 9px 12px;
      padding: 13px 16px;
      min-height: 54px;
      border-left: 5px solid var(--green);
      background: #EDF2EB;
      list-style: none;
      color: var(--ink);
      cursor: pointer;
      font-weight: 700;
    }
    .code details.practice-code > summary::-webkit-details-marker { display: none; }
    .code details.practice-code > summary::marker { content: ""; }
    .code details.practice-code[open] > summary {
      border-bottom: 1.5px solid #A2B4A6;
    }
    .practice-tag {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      background: var(--green);
      color: white;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 8px;
    }
    .practice-name {
      flex: 1 1 220px;
      min-width: 0;
      font-size: 15px;
      font-weight: 750;
    }
    .practice-toggle {
      font-size: 12.5px;
      color: #4E6155;
      white-space: nowrap;
    }
    .practice-open-word { display: none; }
    .practice-code[open] .practice-open-word { display: inline; }
    .practice-code[open] .practice-closed-word { display: none; }
    .practice-chevron {
      width: 10px;
      height: 10px;
      border-right: 2px solid var(--green);
      border-bottom: 2px solid var(--green);
      transform: rotate(45deg);
      margin-right: 4px;
      margin-top: -4px;
      transition: transform 0.15s ease;
    }
    .practice-code[open] .practice-chevron {
      transform: rotate(225deg);
      margin-top: 4px;
    }
    pre {
      white-space: pre;
      max-width: 100%;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.65;
      padding: 16px;
      margin: 14px 16px;
      background: #172330;
      color: #E7ECF5;
      border-radius: 7px;
      tab-size: 4;
    }
    .practice-code .code-comment { color: #B5D9B4; font-weight: 500; }
    .practice-code .code-critical { color: #D0F0A2; font-weight: 750; }
    .practice-takeaway {
      margin: 0 16px 15px;
      border-left: 3px solid var(--green);
      background: var(--paper);
      padding: 11px 14px;
      border-radius: 4px;
      line-height: 1.65;
      font-size: 14px;
    }
    .practice-takeaway b { color: var(--green); display: block; margin-bottom: 2px; }
    .finding-box {
      margin: 18px 0 22px;
      background: #EDF2EB;
      border: 1.5px solid var(--green);
      border-left: 5px solid var(--green);
      border-radius: var(--corner);
      padding: 16px 18px;
    }
    .finding-head {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .finding-badge {
      display: inline-block;
      padding: 3px 8px;
      background: var(--green);
      color: var(--paper);
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.03em;
    }
    .finding-head strong {
      font-size: 16px;
      color: var(--ink);
    }
    .finding-list {
      margin: 0;
      padding-left: 20px;
      font-size: 15px;
      line-height: 1.72;
    }
    .finding-list li {
      margin: 6px 0;
    }
    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1.5px solid var(--line);
    }
    .tag-chip {
      font-size: 13px;
      padding: 3px 10px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 4px;
      color: var(--muted);
    }
    .edition-nav {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid var(--line);
    }
    .edition-nav-card {
      background: var(--paper);
      border: 1.5px solid var(--line);
      border-radius: var(--corner);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .edition-nav-card:not(.empty):hover {
      border-color: var(--green);
      transform: translateY(-2px);
    }
    .edition-nav-card.right { text-align: right; }
    .edition-nav-card.empty { opacity: 0.55; }
    .edition-nav-dir {
      font-size: 11.5px;
      color: var(--blue);
      font-weight: 700;
    }
    .edition-nav-card strong {
      font-size: 15px;
      line-height: 1.4;
    }
    @media (max-width: 650px) {
      body { font-size: 16px; }
      .top-bar, main { width: calc(100% - 32px); }
      main { padding: 26px 0 70px; }
      .toc ol, .compare, .formula-line, .edition-nav { grid-template-columns: 1fr; }
      .edition-nav-card.right { text-align: left; }
      pre { margin: 12px; font-size: 12px; }
      .practice-takeaway { margin: 0 12px 12px; }
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <a class="brand-link serif-title" href="../index.html">HangJoo Editions &amp; Notes</a>
    <a class="back-link" href="../index.html">← 서가(전체 목록)로 돌아가기</a>
  </div>
  <main>
    <header class="post-header">
      <div class="post-meta">
        <span class="issue-pill mono">${escapeHtml(post.meta.issue)}</span>
        <span class="cat-label">${escapeHtml(post.meta.category)}</span>
        <span style="color:var(--muted)">· ${escapeHtml(post.meta.date)} · 읽는 시간 ${escapeHtml(post.meta.readTime)}</span>
      </div>
      <h1>${escapeHtml(post.meta.title)}</h1>
      <p class="lead">${escapeHtml(post.meta.summary)}</p>
      <div class="cover-stage">
        <div class="cover-svg-wrap">
          ${post.coverSvg}
        </div>
        ${
          post.meta.takeaway
            ? `<div class="cover-caption"><strong>핵심 요약:</strong> ${escapeHtml(post.meta.takeaway)}</div>`
            : ''
        }
      </div>
      <nav class="toc" aria-label="목차">
        <strong>목차 (Table of Contents)</strong>
        <ol>${tocItems}</ol>
      </nav>
    </header>

    ${sectionsHtml}

    <div class="tag-row">
      ${(post.meta.tags || []).map((t) => `<span class="tag-chip mono">#${escapeHtml(t)}</span>`).join('')}
    </div>

    ${navNeighbors}
  </main>
</body>
</html>`;
}

function buildShelfIndexHtml(posts) {
  const preferredOrder = ['Python', 'NumPy', 'Pandas', 'Data & ML', 'Deep Learning', 'Project ASCEND'];
  const presentCategories = [...new Set(posts.map((p) => p.meta.category))];
  presentCategories.sort((a, b) => {
    const ia = preferredOrder.indexOf(a);
    const ib = preferredOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const categories = ['All', ...presentCategories];

  const cardsHtml = posts
    .map((p) => {
      const catUpper = (p.meta.category || 'NOTE').toUpperCase();
      const accentColor = p.meta.category === 'Project ASCEND' ? 'var(--green)' : 'var(--blue)';
      const tagsAttr = (p.meta.tags || []).join(' ');
      return `
        <article class="zine-item" data-category="${escapeHtml(p.meta.category)}" data-search="${escapeHtml(
        `${p.meta.title} ${p.meta.summary} ${tagsAttr} ${p.meta.category}`.toLowerCase()
      )}">
          <a class="zine-link" href="./posts/${p.slug}.html" aria-label="${escapeHtml(p.meta.title)} 읽기">
            <div class="zine-cover">
              <div class="zine-cover-top mono">
                <span>${escapeHtml(p.meta.issue)}</span>
                <span class="zine-cat" style="color:${accentColor}">${escapeHtml(catUpper)}</span>
              </div>
              <div class="zine-title-wrap">
                <h2 class="serif-title zine-title">${escapeHtml(p.meta.title)}</h2>
              </div>
              <div class="zine-thumb">
                ${p.coverSvg}
              </div>
              <div class="zine-cover-foot mono">
                <span>HANGJOO</span>
                <span>${escapeHtml(p.meta.date.replace(/-/g, '.'))} · ${escapeHtml(p.meta.readTime)}</span>
              </div>
            </div>
            <p class="zine-summary">${escapeHtml(p.meta.summary)}</p>
            <div class="zine-tags mono">
              ${(p.meta.tags || []).map((t) => `<span>#${escapeHtml(t)}</span>`).join('')}
            </div>
          </a>
        </article>
      `;
    })
    .join('\n');

  const filterButtonsHtml = categories
    .map((cat, idx) => {
      const count = cat === 'All' ? posts.length : posts.filter((p) => p.meta.category === cat).length;
      const label = cat === 'All' ? `전체 서가 (${count})` : `${cat} (${count})`;
      return `<button type="button" class="filter-btn ${idx === 0 ? 'active' : ''}" data-filter="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>HangJoo — Editions &amp; Notes</title>
  <meta name="description" content="HangJoo의 개인 프로젝트 개발(Project ASCEND) 및 엔지니어링·학습 기록을 소책자 표지처럼 엮은 에디토리얼 서가입니다." />
  <style>
    ${SHARED_TOKENS_CSS}
    .container {
      width: min(calc(100% - 44px), var(--shelf-width));
      margin: 0 auto;
    }
    header.site-header {
      border-bottom: 2px solid var(--line);
      background: var(--canvas);
    }
    .header-inner {
      padding: 26px 0 20px;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .site-brand {
      display: flex;
      align-items: baseline;
      gap: 12px;
      flex-wrap: wrap;
    }
    .site-brand h1 {
      font-size: clamp(26px, 3.5vw, 34px);
      font-weight: 780;
      letter-spacing: -0.03em;
      margin: 0;
    }
    .site-brand span {
      font-size: 14px;
      color: var(--muted);
    }
    .site-nav {
      display: flex;
      align-items: center;
      gap: 18px;
      font-size: 14px;
      font-weight: 650;
    }
    .site-nav a {
      color: var(--muted);
      padding-bottom: 3px;
    }
    .site-nav a.current {
      color: var(--green);
      border-bottom: 2px solid var(--green);
    }
    .shelf-intro {
      padding: 34px 0 22px;
      border-bottom: 2px solid var(--line);
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .shelf-intro h2 {
      font-size: clamp(20px, 2.8vw, 26px);
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }
    .shelf-intro p {
      margin: 0;
      font-size: 15px;
      color: var(--muted);
    }
    .volume-badge {
      font-size: 12.5px;
      color: var(--blue);
      font-weight: 700;
      background: var(--surface);
      border: 1.5px solid var(--line);
      padding: 6px 12px;
      border-radius: 6px;
    }
    .toolbar {
      padding: 18px 0 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .filter-btn {
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 650;
      padding: 7px 14px;
      border-radius: 6px;
      border: 1.5px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn:hover {
      border-color: var(--green);
    }
    .filter-btn.active {
      background: var(--green);
      color: var(--paper);
      border-color: var(--green);
    }
    .search-input {
      font-family: inherit;
      font-size: 13.5px;
      padding: 7px 12px;
      border-radius: 6px;
      border: 1.5px solid var(--line);
      background: var(--paper);
      color: var(--ink);
      min-width: 220px;
    }
    .search-input:focus {
      outline: 2px solid var(--green);
      outline-offset: 1px;
    }
    .zine-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 24px 20px;
      padding-bottom: 64px;
    }
    .zine-item {
      display: flex;
      flex-direction: column;
    }
    .zine-link {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    /* Portrait 3:4 Book-Cover Card */
    .zine-cover {
      aspect-ratio: 3 / 4;
      background: var(--paper);
      border: 1.5px solid var(--ink);
      border-radius: 5px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.16s ease, border-color 0.16s ease;
    }
    .zine-link:hover .zine-cover {
      transform: translateY(-4px);
      border-color: var(--green);
    }
    .zine-cover-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
      color: var(--muted);
    }
    .zine-cat {
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .zine-title-wrap {
      margin: 10px 0;
      flex: 1 0 auto;
      display: flex;
      align-items: center;
    }
    .zine-title {
      font-size: 17px;
      line-height: 1.38;
      font-weight: 750;
      margin: 0;
      color: var(--ink);
    }
    .zine-thumb {
      aspect-ratio: 16 / 10;
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 3px;
      overflow: hidden;
      background: var(--surface);
    }
    .zine-thumb svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .zine-cover-foot {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted);
    }
    .zine-summary {
      font-size: 13.5px;
      line-height: 1.55;
      color: var(--muted);
      margin: 10px 2px 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .zine-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11.5px;
      color: var(--blue);
      padding: 0 2px;
    }
    .empty-state {
      display: none;
      padding: 40px 20px;
      text-align: center;
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--corner);
      color: var(--muted);
      margin-bottom: 60px;
    }
    footer.site-footer {
      border-top: 2px solid var(--line);
      padding: 28px 0 60px;
      font-size: 13.5px;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    @media (max-width: 980px) {
      .zine-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .container { width: calc(100% - 32px); }
      .zine-grid { grid-template-columns: 1fr; }
      .search-input { width: 100%; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="site-brand">
        <h1 class="serif-title">HangJoo</h1>
        <span>Development &amp; Study Editions</span>
      </div>
      <nav class="site-nav" aria-label="주요 메뉴">
        <a href="./index.html" class="current">Editions</a>
        <a href="https://github.com/HJ-GJ/HangJoo" target="_blank" rel="noopener">GitHub</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <section class="shelf-intro">
      <div>
        <h2 class="serif-title">HangJoo Editions &amp; Notes</h2>
        <p>만들면서 부딪힌 프로젝트 개발기(Project ASCEND)와 학습 노트를 한 권의 소책자 표지처럼 엮어 보관하는 개인 서가입니다.</p>
      </div>
      <div class="volume-badge mono">VOLUME 2026 · ${String(posts.length).padStart(2, '0')} EDITIONS</div>
    </section>

    <section class="toolbar" aria-label="카테고리 필터 및 검색">
      <div class="filter-group" id="filter-group">
        ${filterButtonsHtml}
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button id="sort-btn" type="button" class="filter-btn mono" data-order="asc" title="정렬 순서 전환">
          정렬: 일자순 (NO. 01 →)
        </button>
        <input
          id="search-box"
          type="search"
          class="search-input"
          placeholder="제목, 태그, 키워드 검색..."
          aria-label="글 검색"
        />
      </div>
    </section>

    <section class="zine-grid" id="zine-grid">
      ${cardsHtml}
    </section>

    <div id="empty-state" class="empty-state">
      조건에 맞는 글이 없습니다. 다른 카테고리나 검색어를 선택해 보세요.
    </div>
  </main>

  <footer class="container site-footer">
    <div>© 2026 HangJoo · Warm Editorial Zine Archive</div>
    <div class="mono">Built with Markdown &amp; GitHub</div>
  </footer>

  <script>
    (function () {
      const buttons = Array.from(document.querySelectorAll('#filter-group .filter-btn'));
      const sortBtn = document.getElementById('sort-btn');
      const grid = document.getElementById('zine-grid');
      const searchBox = document.getElementById('search-box');
      const items = Array.from(document.querySelectorAll('.zine-item'));
      const emptyState = document.getElementById('empty-state');
      let activeFilter = 'All';

      function applyFilter() {
        const query = (searchBox.value || '').trim().toLowerCase();
        let visibleCount = 0;
        items.forEach((item) => {
          const cat = item.getAttribute('data-category');
          const hay = item.getAttribute('data-search') || '';
          const matchCat = activeFilter === 'All' || cat === activeFilter;
          const matchQuery = !query || hay.includes(query);
          const show = matchCat && matchQuery;
          item.style.display = show ? '' : 'none';
          if (show) visibleCount++;
        });
        emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      }

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          buttons.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          activeFilter = btn.getAttribute('data-filter') || 'All';
          applyFilter();
        });
      });

      sortBtn.addEventListener('click', () => {
        const currentOrder = sortBtn.getAttribute('data-order');
        const nextOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        sortBtn.setAttribute('data-order', nextOrder);
        sortBtn.textContent = nextOrder === 'asc' ? '정렬: 일자순 (NO. 01 →)' : '정렬: 최신순 (NO. ${String(posts.length).padStart(2, '0')} →)';
        const currentCards = Array.from(grid.children);
        currentCards.reverse().forEach((card) => grid.appendChild(card));
      });

      searchBox.addEventListener('input', applyFilter);
    })();
  </script>
</body>
</html>`;
}

function main() {
  fs.mkdirSync(POSTS_OUT_DIR, { recursive: true });
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const posts = files.map((filename) => {
    const fullPath = path.join(CONTENT_DIR, filename);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = filename.replace(/\.md$/, '');
    const sections = renderMarkdown(body);
    const coverSvg = getCoverSvg(meta.coverType, meta.category);
    return { filename, slug, meta, sections, coverSvg };
  });

  // Sort chronologically (Day 1 -> Latest) so Python Day 1 (NO. 01) starts first
  posts.sort((a, b) => (a.meta.date || '').localeCompare(b.meta.date || ''));

  // Write individual article HTML pages
  posts.forEach((post, idx) => {
    const prevPost = idx > 0 ? posts[idx - 1] : null; // earlier edition
    const nextPost = idx < posts.length - 1 ? posts[idx + 1] : null; // next chronological edition
    const html = buildArticleHtml(post, prevPost, nextPost);
    fs.writeFileSync(path.join(POSTS_OUT_DIR, `${post.slug}.html`), html, 'utf8');
  });

  // Write root index.html (Book-Cover Zine Shelf)
  const indexHtml = buildShelfIndexHtml(posts);
  fs.writeFileSync(path.join(ROOT, 'index.html'), indexHtml, 'utf8');

  // Write posts.json metadata index
  const jsonIndex = posts.map((p) => ({
    slug: p.slug,
    url: `./posts/${p.slug}.html`,
    ...p.meta,
  }));
  fs.writeFileSync(path.join(ROOT, 'posts.json'), JSON.stringify(jsonIndex, null, 2) + '\n', 'utf8');

  // Write .nojekyll for GitHub Pages
  fs.writeFileSync(path.join(ROOT, '.nojekyll'), '', 'utf8');

  console.log(`Built ${posts.length} editions into index.html and posts/*.html`);
}

main();
