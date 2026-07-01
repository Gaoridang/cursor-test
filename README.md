# Cursor Test

Expo (React Native) app configured for iPhone development.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (this repo uses Node 22)
- **For iPhone (Expo Go):** [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on your iPhone
- **For native iOS builds:** macOS with [Xcode](https://developer.apple.com/xcode/) and CocoaPods

## Install

```bash
npm install
```

## Run on your iPhone (Expo Go — no Mac required)

1. Install **Expo Go** from the App Store on your iPhone.
2. Start the dev server on your computer:

   ```bash
   npm start
   ```

3. Connect your iPhone:
   - **Same Wi‑Fi:** Open the Camera app and scan the QR code shown in the terminal, or tap the project in Expo Go.
   - **Different network / remote:** Use tunnel mode:

     ```bash
     npm run start:tunnel
     ```

     Scan the QR code with your iPhone camera.

4. The app loads in Expo Go. Edits to `App.tsx` hot-reload on save.

## Run on iPhone Simulator or device (macOS + Xcode)

Requires a Mac with Xcode installed:

```bash
npm run ios
```

This opens the iOS Simulator. To run on a physical device connected via USB, use Xcode to select your device, or:

```bash
npx expo run:ios --device
```

For a standalone native project (without Expo Go):

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

## Other commands

| Command | Description |
|--------|-------------|
| `npm start` | Start Metro bundler (Expo dev server) |
| `npm run start:tunnel` | Dev server with tunnel (works across networks) |
| `npm run web` | Run in the browser (quick local check) |
| `npm run typecheck` | TypeScript check |
| `npm run build:ios:testflight` | Build iOS app and submit to TestFlight (EAS) |
| `npm run build:ios` | Build iOS production `.ipa` only |
| `npm run submit:ios` | Submit latest iOS build to TestFlight |

## TestFlight 배포 (iPhone에 앱 설치)

Expo Go 없이 **독립 앱**으로 iPhone에 설치하려면 TestFlight를 사용합니다. Mac 없이 **EAS Build**로 빌드할 수 있습니다.

**필요:** Apple Developer Program ($99/년), Expo 계정, App Store Connect 앱 등록

```bash
npm install
npx eas login
npm run eas:init
npm run build:ios:testflight
```

빌드 처리 후 iPhone **TestFlight** 앱에서 설치합니다.

자세한 단계별 가이드: **[docs/TESTFLIGHT.ko.md](./docs/TESTFLIGHT.ko.md)**

## Project structure

- `App.tsx` — root React Native component
- `app.json` — Expo config (iOS bundle ID, app name, icons)
- `assets/` — app icons and splash images
