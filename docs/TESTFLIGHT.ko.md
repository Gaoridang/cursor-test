# TestFlight 배포 가이드

Expo **EAS Build** + **EAS Submit**으로 Mac 없이도 iOS 앱을 빌드하고 TestFlight에 올릴 수 있습니다.

## 필요한 것

| 항목 | 설명 |
|------|------|
| [Apple Developer Program](https://developer.apple.com/programs/) | 연 **$99** (TestFlight 필수) |
| [Expo 계정](https://expo.dev/signup) | EAS 빌드/제출용 (무료 티어로 시작 가능) |
| App Store Connect 앱 등록 | Bundle ID `com.gaoridang.cursortest` 로 앱 생성 |

> **주의:** TestFlight 배포는 이 저장소 설정만으로 자동 완료되지 않습니다. Apple·Expo 계정 인증과 App Store Connect 설정은 **본인 계정**으로 진행해야 합니다.

## 1단계: Expo 프로젝트 연결

```bash
npm install
npx eas login
npm run eas:init
```

`eas init` 실행 후 `app.json`에 `extra.eas.projectId`가 추가됩니다.

## 2단계: App Store Connect에 앱 등록

1. [App Store Connect](https://appstoreconnect.apple.com/) → **앱** → **+** → **새로운 앱**
2. **Bundle ID:** `com.gaoridang.cursortest` (Developer Portal에 등록된 ID 선택)
3. 앱 이름: **Cursor Test** (또는 원하는 이름)

앱 생성 후 **앱 정보** 페이지 URL의 숫자 ID가 `ascAppId`입니다.  
예: `https://appstoreconnect.apple.com/apps/1234567890/...` → `1234567890`

선택: `eas.json`의 `submit.production.ios`에 추가하면 이후 제출 시 매번 묻지 않습니다.

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "1234567890"
    }
  }
}
```

## 3단계: iOS 빌드 + TestFlight 제출 (한 번에)

```bash
npm run build:ios:testflight
```

또는 단계별:

```bash
# 빌드만 (Expo 클라우드에서 iOS .ipa 생성)
npm run build:ios

# 빌드 완료 후 TestFlight 업로드
npm run submit:ios
```

첫 실행 시 EAS CLI가 Apple 계정 로그인, 인증서, 프로비저닝 프로파일 생성을 안내합니다. **Apple ID + 앱 전용 비밀번호** 또는 **App Store Connect API Key** 중 하나를 사용합니다.

## 4단계: iPhone에서 설치

1. App Store Connect → **TestFlight** 탭에서 빌드 처리 완료 대기 (보통 **10~15분**)
2. **내부 테스트** 그룹에 본인 Apple ID 추가 (최대 100명, 승인 없이 즉시)
3. iPhone에 **TestFlight** 앱 설치 → 초대 메일/링크로 **Cursor Test** 설치

외부 테스터(최대 10,000명)는 Apple **베타 앱 검수** 후 배포 가능합니다. 본인만 쓸 경우 **내부 테스트**가 가장 빠릅니다.

## 버전 올릴 때

- `app.json`의 `expo.version` (예: `1.0.1`) — 사용자에게 보이는 버전
- `eas.json`의 `production.autoIncrement: true` — iOS `buildNumber` 자동 증가

변경 후 다시:

```bash
npm run build:ios:testflight
```

## 비용 참고

- **Apple Developer:** $99/년
- **EAS Build:** [Expo 요금제](https://expo.dev/pricing) — 무료 플랜은 월 제한 있음, iOS 빌드는 유료 플랜 권장

## 문제 해결

| 증상 | 해결 |
|------|------|
| Bundle ID 충돌 | Developer Portal / App Store Connect에서 ID 확인 |
| 제출 실패 (인증) | [App Store Connect API Key](https://docs.expo.dev/submit/ios/#using-app-store-connect-api-key) 생성 후 EAS에 등록 |
| TestFlight에 안 보임 | App Store Connect에서 **수출 규정**·**암호화** 문항 완료 (`ITSAppUsesNonExemptEncryption: false` 이미 설정됨) |

공식 문서: [Expo — Submit to Apple App Store](https://docs.expo.dev/submit/ios/)
