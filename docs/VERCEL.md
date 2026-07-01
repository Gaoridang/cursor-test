# Vercel 배포 가이드

env 없이도 **Keyword 검색**까지 포함한 블로그는 바로 배포됩니다.  
xAI env를 나중에 넣으면 **Semantic / All** 탭이 자동으로 활성화됩니다.

## 1. 지금 바로 배포 (env 없음)

1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub 레포 `cursor-test` 연결
3. 브랜치 선택 (`main` 또는 feature 브랜치)
4. Framework: **Next.js** (자동 감지)
5. `vercel.json`이 빌드 명령을 관리하므로 기본 설정 그대로 **Deploy**

동작:

- 홈 / 글 상세 페이지
- **Keyword** 탭 BM25 검색 (`Cmd+K`)
- Semantic / All 탭 → API 미설정 시 Keyword 결과로 폴백

## 2. 나중에 Semantic 검색 활성화

Vercel **Project → Settings → Environment Variables**에 추가:

| 변수 | 설명 |
|------|------|
| `XAI_API_KEY` | 문서 검색 API 키 |
| `XAI_MANAGEMENT_API_KEY` | Collection 업로드용 Management 키 |
| `XAI_COLLECTION_ID` | 블로그용 Collection ID |
| `NEXT_PUBLIC_SITE_URL` | 배포 URL (예: `https://essos-blog.vercel.app`) |

[xAI Console](https://console.x.ai)에서 Collection 생성 후 위 값을 입력하고 **Redeploy**합니다.

빌드 시 자동으로:

1. `build-search-index.mjs` → BM25 인덱스 생성
2. `sync-collections.mjs` → xAI Collection에 글 동기화 (env 있을 때만)

## 3. 빌드 파이프라인

```
vercel-build.mjs
  ├── build-search-index.mjs   (항상 실행)
  └── sync-collections.mjs     (XAI_* 없으면 skip)
next build
```

## 4. 로컬에서 env 테스트

```bash
cp .env.example .env.local
# .env.local 에 키 입력
npm run dev
npm run sync:collections   # 수동 sync 테스트
npm run build
```

## 5. 주의사항

- `/api/search` 때문에 **Static Export (`output: 'export'`)는 사용 불가** — Vercel Next.js 호스팅 사용
- Vercel 빌드 환경은 일시적이라 sync state는 xAI Collection의 `contentHash` 필드로 재동기화합니다 (중복 업로드 방지)
- 로컬에서는 `collection-sync-state.json`이 state를 저장합니다
