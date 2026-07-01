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

### Expo docs

Read versioned docs at https://docs.expo.dev/versions/v57.0.0/ before changing Expo APIs.
