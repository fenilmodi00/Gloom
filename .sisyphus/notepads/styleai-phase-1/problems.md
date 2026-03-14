## 2026-03-12 Blocking Issues (fix-expo-go-connection)

- **Windows Expo Metro config loader bug**: When `metro.config.js` (or `.cjs`) exists, Expo startup fails with `ERR_UNSUPPORTED_ESM_URL_SCHEME` on absolute `D:\...` path. This blocks keeping NativeWind metro wrapper enabled on this machine.
- **Physical device dependency**: Final checklist items require Expo Go on Android physical device. Local automation cannot confirm these without a compatible Expo Go client/device interaction.
- **Expo Go version mismatch**: Device reports `Project is incompatible with this version of Expo Go` even when Metro is healthy. Requires device-side install from `expo.dev/go` or development build route.
