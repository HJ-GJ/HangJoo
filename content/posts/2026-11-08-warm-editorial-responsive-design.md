---
issue: "NO. 01"
title: "Warm Editorial 색감과 360px 반응형 기술 문서 설계"
date: "2026-11-08"
category: "Engineering"
readTime: "4분"
tags: ["Design", "CSS", "Editorial", "Responsive"]
summary: "눈이 피로하지 않은 미색 종이 톤(#FFFEF2)과 북커버 서가 레이아웃을 결합하고, 폴드 커버 화면(360px)부터 데스크톱까지 표와 코드가 깨지지 않는 기준을 정리합니다."
coverType: "editorial-grid"
takeaway: "좋은 기술 블로그 디자인은 화려한 그라데이션이 아니라, 본문 줄길이(820px 이하), 명확한 구획선, 그리고 좁은 화면에서도 무너지지 않는 내부 스크롤 격리에서 결정됩니다."
---

## 1. 왜 Warm Editorial 색감과 북커버 서가인가

개발 블로그와 학습 노트는 한 번에 5분 이상 긴 호흡으로 읽는 공간입니다. 순백색(`#FFFFFF`) 배경이나 채도 높은 네온 컬러 대신, 종이책에 가까운 따뜻한 미색 바탕과 절제된 포레스트 그린 포인트를 사용해 시각적 피로를 줄였습니다.

:::compare
### 흔한 템플릿 UI의 문제
- 채도 높은 보라·파랑 그라데이션과 과도한 그림자 남발
- 글의 위계보다 장식 요소가 먼저 눈에 들어와 집중력 분산
- 모바일에서 코드 블록이나 수식 표가 화면 밖으로 넘침
---
### HangJoo Warm Editorial 기준
- 바탕 `#FFFEF2` · 종이 `#FFFEF7` · 표면 `#F4F2E5` · 잉크 `#333333`
- 각 글을 `3:4` 비율의 소책자(Zine) 표지처럼 아카이빙하는 서가 구조
- 1.5px 실선 테두리와 넉넉한 여백으로 문단과 도식을 명확히 분리
:::

## 2. 좁은 화면(360px)에서도 바깥 스크롤이 생기지 않는 규칙

폴더블 스마트폰의 커버 화면(`360px`)이나 작은 모바일 뷰포트에서는 표(`<table>`)나 긴 코드 한 줄 때문에 페이지 전체에 가로 스크롤이 생기기 쉽습니다. 이를 막기 위해 **바깥 레이아웃은 1열로 리플로우**하고, **넓은 요소는 내부 컨테이너에서만 가로 스크롤**되도록 격리합니다.

```css
/* title: editorial-responsive.css — 360px 모바일 및 폴더블 대응 핵심 규칙 */
/* takeaway: 페이지 전체는 가로 넘침을 허용하지 않고, 표·코드·다이어그램만 자체 스크롤 컨테이너를 갖도록 분리합니다. */
:root {
  --canvas: #FFFEF2;
  --paper: #FFFEF7;
  --surface: #F4F2E5;
  --ink: #333333;
  --line: #BBB9A8;
  --green: #285E4F;
  --read-width: 820px;
}

/* 핵심: 표와 코드 블록은 자신의 컨테이너 내부에서만 가로 스크롤됩니다. */
.table-wrap,
.diagram-viewport,
pre {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 650px) {
  .compare,
  .formula-line {
    grid-template-columns: 1fr;
  }
}
```

## 3. 이 블로그에 글을 추가하는 방법

이 저장소는 외부 프레임워크 의존성 없이 마크다운(`content/posts/*.md`) 파일 하나만 작성하면 정적 HTML과 북커버 서가 카드가 자동으로 빌드되도록 구성되어 있습니다.

- **새 글 초안 생성:** `npm run new "글 제목" "Project ASCEND"` 실행
- **정적 페이지 빌드:** `npm run build` 실행 (`index.html`, `posts/*.html`, `posts.json` 자동 갱신)
- **자동 배포:** `main` 브랜치에 푸시하면 GitHub Actions가 GitHub Pages로 즉시 배포합니다.
