# Fix Expo Go "Failed to download remote update" Error

## TL;DR

> **Quick Summary**: Fix multiple configuration issues preventing StyleAI Expo app from loading on a physical Android phone via Expo Go. The primary causes are a stripped `app.json` missing critical fields (especially `plugins: ["expo-router"]`), missing `.env.local` causing a startup crash, and a broken `metro.config.js` that doesn't extend Expo's default config.
> 
> **Deliverables**:
> - Restored `app.json` with all required Expo + expo-router fields
> - Properly configured `metro.config.js` with NativeWind support
> - Working `.env.local` with placeholder values
> - Fixed routing structure (root layout + tab layout)
> - App successfully loads in Expo Go on physical device
> 
> **Estimated Effort**: Short (1-2 hours)
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 (app.json) → Task 2 (metro.config) → Task 5 (verify)

---

## Context

### Original Request
User gets `Uncaught Error: java.io.IOException: Failed to download remote update` with `Fatal Error` on their physical Android phone when trying to open the StyleAI app in Expo Go. Phone and dev machine are on same WiFi. Project is at `D:\gloom\StyleAI` on Windows.

### Interview Summary
**Key Findings from Exhaustive Codebase Analysis**:
- `app.json` has been stripped to only 10 lines — missing `scheme`, `plugins`, `orientation`, `icon`, `splash`, `ios`/`android`/`web` sections, and `experiments`
- The original `app.json.bak` has all these fields and should be used as reference
- No `.env.local` file exists — only `.env.local.example` — causing `throw new Error()` at startup
- `metro.config.js` does NOT extend `expo/metro-config` and is missing NativeWind integration
- Tab layout registers `favorites` and `profile` screens that have no backing files
- Root layout references `login` and `onboarding` as direct routes but they're in `(auth)/` group
- NativeWind v4 babel plugin is commented out; `global.css` only loaded on web
- Windows Firewall may block Metro bundler port

### Metis Review
**Identified Gaps** (addressed):
- Added cache clearing step as part of verification
- Added `--tunnel` fallback recommendation
- Added `.env.local` to `.gitignore` check
- Noted IPv4/IPv6 edge case in network diagnostics
- Added adb logcat diagnostic step

---

## Work Objectives

### Core Objective
Fix all configuration issues that prevent the Expo Go app from downloading and running the Metro bundle on a physical Android device.

### Concrete Deliverables
- `app.json` — fully restored with all required fields from backup + proper updates config
- `metro.config.js` — properly extends `expo/metro-config` with NativeWind `withNativeWind()`
- `babel.config.js` — correct plugin order for NativeWind v4 + Reanimated
- `.env.local` — created with safe placeholder values that won't crash the app
- `app/_layout.tsx` — fixed Stack.Screen names to match actual file structure
- `app/(tabs)/_layout.tsx` — cleaned up ghost screen registrations
- Verified working app in Expo Go

### Definition of Done
- [x] `npx expo start --lan` serves the app without errors
- [ ] Expo Go on Android phone loads the app without "Failed to download remote update"
  - Blocked by client version mismatch: device reports "Project is incompatible with this version of Expo Go".
- [x] No crash-at-startup from missing env vars
- [x] Metro bundler logs show 0 configuration errors
- [ ] All tab navigation works (Inspo, Wardrobe, Outfits)
  - Pending manual device verification in Expo Go.
  - Blocked until Expo Go SDK compatibility issue on physical device is resolved.

### Must Have
- Proper `plugins: ["expo-router"]` in app.json
- `scheme` field in app.json for expo-router
- Metro config extending `expo/metro-config`
- NativeWind properly integrated in metro config
- Safe `.env.local` that doesn't crash the app
- Correct routing structure

### Must NOT Have (Guardrails)
- DO NOT change any screen implementations (UI, business logic)
- DO NOT update dependency versions (fix config only)
- DO NOT modify database schema or Supabase functions
- DO NOT add new features or screens
- DO NOT commit `.env.local` to git
- DO NOT modify `app.json.bak` (preserve as backup reference)
- DO NOT change the project structure beyond fixing routing mismatches

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (jest-expo configured)
- **Automated tests**: NO — this is a config fix, not a feature. Verification is runtime-based.
- **Framework**: jest-expo (existing, not used for this task)

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Config validation**: Use Bash — `npx expo config` to verify app.json is valid
- **Metro bundler**: Use Bash — `npx expo start --lan` and check for errors
- **App loading**: Use interactive_bash (tmux) — start Expo, monitor Metro logs for successful bundle serving
- **TypeScript**: Use `lsp_diagnostics` on modified files

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — all config fixes, PARALLEL):
├── Task 1: Fix app.json — restore all missing fields [quick]
├── Task 2: Fix metro.config.js — extend expo/metro-config + NativeWind [quick]
├── Task 3: Create .env.local + fix supabase.ts crash guard [quick]
├── Task 4: Fix routing structure (root layout + tab layout) [quick]

Wave 2 (After Wave 1 — verification):
├── Task 5: Full verification — expo config + start + device test [deep]

Critical Path: Tasks 1-4 (parallel) → Task 5 (verify all)
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1    | —         | 5      |
| 2    | —         | 5      |
| 3    | —         | 5      |
| 4    | —         | 5      |
| 5    | 1, 2, 3, 4| —     |

### Agent Dispatch Summary

- **Wave 1**: **4 tasks** — T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `quick`
- **Wave 2**: **1 task** — T5 → `deep`

---

## TODOs

---

## Final Verification Wave

> This is integrated into Task 5 since this is a small config-fix plan.
> Task 5 performs all verification roles: config audit, build check, runtime QA, and scope fidelity.

---

## Commit Strategy

- **Single commit after all fixes**: `fix(config): restore app.json, metro config, env vars, and routing for Expo Go`
  - Files: `app.json`, `metro.config.js`, `babel.config.js`, `.env.local`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
  - Pre-commit: `npx expo config --type public` (validates config)

---

## Success Criteria

### Verification Commands
```bash
npx expo config --type public   # Expected: valid JSON output, no errors
npx expo start --lan            # Expected: Metro bundler starts, QR code shown, no config errors
# On phone: scan QR → app loads without "Failed to download remote update"
```

### Final Checklist
- [x] `app.json` has `plugins: ["expo-router"]`, `scheme`, `orientation`, full platform sections
- [ ] `metro.config.js` extends `expo/metro-config` and wraps with `withNativeWind()`
  - Blocked currently on Windows: custom Metro config triggers `ERR_UNSUPPORTED_ESM_URL_SCHEME`; temporary workaround is disabling custom metro config.
- [x] `.env.local` exists with safe placeholder values
- [x] `lib/supabase.ts` doesn't crash when env vars are placeholders
- [x] Root layout Stack.Screen names match actual file routes
- [x] Tab layout doesn't reference non-existent screen files
- [ ] App loads in Expo Go on physical Android device
  - Pending device-side Expo Go update path (Play Store lag/manual install via expo.dev/go).
- [ ] All tabs navigate correctly
  - Pending manual device navigation check.
  - Blocked by Expo Go client reporting SDK mismatch.
- [x] No TypeScript errors in modified files
