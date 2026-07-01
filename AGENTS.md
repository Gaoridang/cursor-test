# Cursor Test — agent notes

Expo SDK 57 React Native app (TypeScript). See [README.md](./README.md) for standard commands.

## Cursor Cloud specific instructions

This cloud VM is **Linux** — you cannot run the iOS Simulator or `expo run:ios` here. Use these checks instead:

| Check | Command |
|-------|---------|
| TypeScript | `npm run typecheck` |
| Dev server | `npm start` (Metro on port 8081) |
| Browser smoke test | `npm run web` (port 8081 or 19006) |

### Running on a physical iPhone

iPhone testing happens **on the user's Mac or local machine**, not in this Linux VM:

1. User runs `npm install && npm start` locally (or `npm run start:tunnel` if phone and laptop are on different networks).
2. User opens **Expo Go** on iPhone and scans the QR code.

Native iOS builds (`npx expo prebuild`, `npx expo run:ios --device`) require **macOS + Xcode** on the user's machine.

### iOS config

- Bundle ID: `com.gaoridang.cursortest` (in `app.json`)
- Generated `/ios` and `/android` folders are gitignored; use `npx expo prebuild` locally when native projects are needed.

### TestFlight (EAS)

TestFlight 배포는 사용자 Apple/Expo 계정으로 로컬 또는 CI에서 실행. 이 Linux VM에서는 `eas build`/`eas submit`을 대신 실행할 수 없음 (인증 필요).

- Config: `eas.json` (production profile + auto-submit)
- User guide: `docs/TESTFLIGHT.ko.md`
- GitHub Actions (no local Windows setup): `docs/GITHUB_ACTIONS.ko.md`, `.github/workflows/testflight.yml`
- Commands: `npm run build:ios:testflight`, `npm run submit:ios`

### Expo docs

Read versioned docs at https://docs.expo.dev/versions/v57.0.0/ before changing Expo APIs.
