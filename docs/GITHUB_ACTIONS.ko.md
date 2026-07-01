# GitHub Actions로 TestFlight 배포 (Windows 로컬 설치 불필요)

**PC에 Node/npm을 설치하지 않아도** GitHub에서 버튼 한 번(또는 `main` push)으로 TestFlight까지 올릴 수 있습니다.

빌드는 **Expo EAS 클라우드**에서 돌아가므로 GitHub Actions runner도 **ubuntu**(Mac runner 불필요)로 충분합니다.

## 전체 흐름

```
GitHub Actions (ubuntu)  →  EAS Build (Expo Mac 클라우드)  →  TestFlight  →  iPhone 설치
```

## 사전 준비 (1회)

### 1. Apple Developer Program
- [developer.apple.com/programs](https://developer.apple.com/programs/) — **$99/년**

### 2. App Store Connect에 앱 등록
- Bundle ID: `com.gaoridang.cursortest`
- [App Store Connect](https://appstoreconnect.apple.com/) → 새 앱 생성
- URL의 숫자 ID = `ascAppId` (나중에 `eas.json`에 넣으면 편함)

### 3. Expo 프로젝트 연결

[expo.dev](https://expo.dev) 가입 후:

1. **Dashboard → Create project** (또는 한 번만 로컬/ Codespaces에서 `npx eas init`)
2. 생성된 **Project ID**를 `app.json`에 추가:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

3. 변경사항을 `main` 브랜치에 push

> Project ID 없으면 EAS Build가 실패합니다.

### 4. App Store Connect API Key (CI용, 권장)

1. App Store Connect → **사용자 및 액세스** → **키** → **App Store Connect API**
2. **Admin** 또는 **App Manager** 권한으로 키 생성 → `.p8` 파일 다운로드
3. **Key ID**, **Issuer ID** 메모

### 5. GitHub Secrets 등록

저장소 → **Settings → Secrets and variables → Actions → New repository secret**

| Secret 이름 | 내용 |
|-------------|------|
| `EXPO_TOKEN` | [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) 에서 생성 |
| `ASC_KEY_ID` | API Key ID (예: `AB12CD34EF`) |
| `ASC_ISSUER_ID` | Issuer UUID |
| `ASC_API_KEY_BASE64` | `.p8` 파일을 base64 인코딩한 문자열 |

**Windows PowerShell**에서 `.p8` base64:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXXX.p8"))
```

**macOS/Linux:**

```bash
base64 -i AuthKey_XXXXX.p8 | tr -d '\n'
```

### 6. (선택) eas.json에 ascAppId 고정

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "1234567890"
    }
  }
}
```

## 배포 실행

### 방법 A: GitHub UI (추천)

1. GitHub 저장소 → **Actions**
2. **Deploy to TestFlight** 워크플로 선택
3. **Run workflow** → `main` 브랜치 → **Run workflow**

### 방법 B: main에 push

`main` 브랜치에 커밋이 push되면 자동 실행됩니다.

## iPhone에서 설치

1. 빌드 + 업로드 완료 후 **10~15분** App Store Connect 처리 대기
2. App Store Connect → **TestFlight** → **내부 테스트**에 본인 Apple ID 추가
3. iPhone **TestFlight** 앱 → **Cursor Test** 설치

## Expo Go vs TestFlight

| | Expo Go | GitHub Actions → TestFlight |
|--|---------|----------------------------|
| Windows 로컬 설치 | Node 필요 | **불필요** (GitHub만) |
| 독립 앱 | ✗ (Expo Go 안에서만) | ✓ |
| Apple $99 | 불필요 | **필요** |
| Expo/EAS | 무료 개발 | 빌드 크레딧 (요금제 확인) |

## 문제 해결

| 오류 | 해결 |
|------|------|
| `Project id is not configured` | `app.json`에 `extra.eas.projectId` 추가 |
| `EXPO_TOKEN` invalid | Expo에서 새 Access Token 발급 |
| Submit 실패 | API Key 권한·Secrets 이름 확인 |
| TestFlight에 안 보임 | App Store Connect 수출/암호화 문항 완료 |

워크플로 파일: [`.github/workflows/testflight.yml`](../.github/workflows/testflight.yml)
