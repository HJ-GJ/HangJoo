# HangJoo — Editions & Notes

> **Live Blog:** [https://hj-gj.github.io/HangJoo/](https://hj-gj.github.io/HangJoo/)  
> **Style:** Warm Editorial (`#FFFEF2` · `#285E4F` · `#6D5B39`) × Book-Cover / Zine Shelf (`3:4` 에디션 표지 아카이브)

만들면서 부딪힌 프로젝트 개발기(**Project ASCEND**)와 엔지니어링·딥러닝 **학습 노트(Study Note)**를 한 권의 소책자 표지처럼 엮어 보관하는 개인 서가입니다.

---

## 글 작성 및 빌드 방법

1. **새 글 마크다운 파일 생성**
   ```bash
   npm run new "새 글 제목" "Project ASCEND"
   ```
   또는 `content/posts/YYYY-MM-DD-slug.md` 파일을 직접 추가합니다.

2. **정적 HTML 및 북커버 서가 빌드**
   ```bash
   npm run build
   npm test
   ```
   - `index.html` (북커버 · 진 셸프 메인 서가)
   - `posts/*.html` (개별 에디토리얼 본문 페이지)
   - `posts.json` (메타데이터 인덱스)

3. **배포**
   - `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml`이 자동으로 GitHub Pages에 배포합니다.
