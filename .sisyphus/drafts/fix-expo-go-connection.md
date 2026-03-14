# Draft: Fix Expo Go "Failed to download remote update" Error

## Error
```
Uncaught Error: java.io.IOException: Failed to download remote update
18:03:15 Fatal Error
```
On physical Android phone via Expo Go, same WiFi network.

## Requirements (confirmed)
- Fix the app so it loads on physical phone in Expo Go over LAN
- User is on Windows (D:\gloom path)
- User has Expo SDK 55

## Root Cause Analysis — MULTIPLE ISSUES FOUND

### CRITICAL ISSUE 1: Stripped app.json — Missing Required Fields
**Current `app.json`:**
```json
{
  "expo": {
    "name": "StyleAI",
    "slug": "styleai",
    "version": "0.1.0",
    "updates": { "enabled": false },
    "jsEngine": "hermes",
    "assetBundlePatterns": ["**/*"]
  }
}
```

**Missing fields** (compare to `app.json.bak` which had them):
- `orientation` — needed for Expo Go
- `scheme` — needed for expo-router deep linking
- `icon` — needed for Expo Go
- `splash` — prevents splash screen errors
- `ios` / `android` sections — platform-specific config
- `web` section — `"bundler": "metro"`, `"output": "static"`
- `plugins: ["expo-router"]` — **CRITICAL** for expo-router to work
- `experiments: { typedRoutes: true }` — enables typed routes

**The `plugins: ["expo-router"]` being MISSING is likely the PRIMARY cause.** Without this, expo-router's config plugin doesn't run, which means the app can't properly set up routing and the Metro bundler may fail to serve the correct bundle to Expo Go.

### CRITICAL ISSUE 2: Missing .env.local File
- Only `.env.local.example` exists, NO actual `.env.local`
- `lib/supabase.ts` line 6-9 has a hard `throw new Error()` if env vars are missing
- This means **app crashes at startup** before it can even render
- The "Failed to download remote update" may be masking this crash

### CRITICAL ISSUE 3: Metro Config is Custom & Problematic
**Current `metro.config.js`:**
```js
module.exports = {
  resolver: {
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  },
  transformer: (() => {
    try {
      return { babelTransformerPath: require.resolve('metro-react-native-babel-transformer') };
    } catch {
      return {};
    }
  })(),
};
```

**Problems:**
1. Does NOT extend `expo/metro-config` — the standard for Expo projects
2. Does NOT include NativeWind v4 CSS interop (required for nativewind to work)
3. Hardcoded `metro-react-native-babel-transformer` may conflict with Expo's expected transformer
4. The `sourceExts` override may be missing extensions Expo needs (e.g. `cjs`)
5. Should use `const { getDefaultConfig } = require('expo/metro-config');` and `withNativeWind()`

### CRITICAL ISSUE 4: Tab Layout References Non-Existent Screens
**In `app/(tabs)/_layout.tsx`:**
```tsx
<Tabs.Screen name="favorites" ... />
<Tabs.Screen name="profile" ... />
```
But NO `favorites.tsx` or `profile.tsx` files exist in `app/(tabs)/`. These have `href: null` so they shouldn't cause routing errors, but expo-router may still try to resolve them.

### ISSUE 5: Root Layout Route Mismatch
**In `app/_layout.tsx`:**
```tsx
<Stack.Screen name="login" options={{ presentation: 'modal' }} />
<Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
```
But `login.tsx` is inside `(auth)/login.tsx`, not at root level. And there are TWO `onboarding.tsx` files:
- `app/onboarding.tsx` (root level — placeholder)
- `app/(auth)/onboarding.tsx` (auth group — full implementation)

The router navigates to `/login` but the file is at `(auth)/login.tsx` — this should work with expo-router groups, but the Stack.Screen name should be `(auth)` not `login`.

### ISSUE 6: NativeWind Not Properly Configured
- `babel.config.js` has the nativewind babel plugin commented out
- `metro.config.js` does NOT use `withNativeWind()` wrapper
- NativeWind v4 requires proper Metro config integration
- `global.css` has Tailwind directives but they're loaded conditionally (web only) in _layout.tsx

### ISSUE 7: Windows Firewall
- Standard Windows Defender Firewall blocks Metro bundler (port 8081)
- User needs to allow Node.js/Bun through firewall
- Or use `--tunnel` mode (ngrok) to bypass

### ISSUE 8: Possible SDK Version Mismatch
- Project uses Expo SDK 55 (`expo: ~55.0.6`)
- SDK 55 was released mid-2025
- Expo Go on phone must match SDK version — if user has older Expo Go, it will fail

## Technical Decisions
- Fix app.json by restoring all missing fields from backup + adding updates config
- Create .env.local with placeholder values (won't crash at startup)
- Fix metro.config.js to use expo/metro-config properly
- Fix root layout routing structure
- Address NativeWind configuration

## Open Questions
- None — all issues are clear and fixable without user input

## Scope Boundaries
- INCLUDE: Fix all configuration issues preventing Expo Go connection
- INCLUDE: Fix app.json, metro.config.js, .env.local, routing
- EXCLUDE: Any feature development
- EXCLUDE: Any changes to screen implementations
