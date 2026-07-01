# essos 블로그

essos 스타일 디자인의 개인 블로그입니다. 클라이언트 BM25 키워드 검색과 Grok Collections 시맨틱 검색을 지원합니다.

## 기술 스택

- **Next.js 15** + TypeScript + CSS Modules
- **콘텐츠:** `content/posts/` 마크다운
- **키워드 검색:** 자체 호스팅 BM25 역색인 (빌드 시 생성)
- **시맨틱 검색:** [xAI Collections API](https://docs.x.ai/developers/files/collections) (하이브리드)

## 시작하기

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인하세요.

## 검색

### 키워드 (오프라인 동작)

인덱스 빌드:

```bash
node scripts/build-search-index.mjs
```

인덱스는 `public/search/index.json`에 저장되며 클라이언트에서 로드됩니다.

한국어 검색은 어절 단위 토큰화와 바이그램(2-gram) 색인을 사용합니다.

### 시맨틱 (Grok Collections)

1. `.env.example`을 `.env.local`로 복사
2. [xAI Console](https://console.x.ai)에서 Collection 생성
3. `XAI_API_KEY`, `XAI_MANAGEMENT_API_KEY`, `XAI_COLLECTION_ID` 설정
4. 글 동기화:

```bash
npm run sync:collections
```

검색 모달 탭:

- **전체** — BM25 + Grok `hybrid` 병합
- **키워드** — 즉시 BM25 (한국어 기반)
- **시맨틱** — Grok Collections `semantic` 모드

`Cmd+K` (또는 `Ctrl+K`)로 검색을 엽니다.

## Vercel 배포

**env 없이도 동작** — xAI 키를 추가하기 전까지는 키워드 검색만 사용됩니다.

1. [vercel.com](https://vercel.com)에서 이 레포 연결
2. 배포 (`vercel.json`이 빌드를 설정)
3. 이후: Vercel → Settings → Environment Variables에 `XAI_API_KEY`, `XAI_MANAGEMENT_API_KEY`, `XAI_COLLECTION_ID`, `NEXT_PUBLIC_SITE_URL` 추가 → 재배포

자세한 내용은 [docs/VERCEL.md](docs/VERCEL.md)를 참고하세요.

## 글 추가하기

`content/posts/`에 파일을 만듭니다:

```markdown
---
title: "내 글 제목"
slug: my-post
date: 2024-08-10
category: 일반
image: /images/placeholder.svg
excerpt: "짧은 설명"
tags: [태그1, 태그2]
---

본문 내용...
```

그다음 인덱스를 재빌드하고 컬렉션을 동기화하세요.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 시작 |
| `npm run build` | 인덱스 빌드 + 프로덕션 빌드 |
| `npm run sync:collections` | xAI Collection에 글 업로드 |
