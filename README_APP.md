# eSIM Mongolia — Mobile App (Capacitor)

Convert the existing **esimmongolia.com** web application into production-ready **Android** and **iOS** apps using [Capacitor 6](https://capacitorjs.com/). The web app is **not rebuilt** — the same HTML/CSS/JS is packaged; APIs stay on **Netlify Functions** at `https://esimmongolia.com`.

| Setting | Value |
|--------|--------|
| App name | eSIM Mongolia |
| Package ID | `com.esimmongolia.app` |
| Website | https://esimmongolia.com |
| Web assets dir | `www/` (generated) |

---

## Architecture

```
┌─────────────────────────────────────┐
│  Capacitor WebView (www/)           │
│  index.html, booking.js, travel-*   │
│  js/api-config.js  → API proxy      │
│  js/capacitor-app.js → native UX    │
└──────────────┬──────────────────────┘
               │ HTTPS only
               ▼
┌─────────────────────────────────────┐
│  https://esimmongolia.com           │
│  /.netlify/functions/*              │
│  Supabase, TGT, QPay, OpenAI      │
│  (secrets in Netlify env only)      │
└─────────────────────────────────────┘
```

- **No API secrets** in the app bundle.
- Native app rewrites `fetch('/.netlify/functions/...')` to `https://esimmongolia.com/.netlify/functions/...`.
- External links (Klook, airlines, QPay payment pages, Google Maps) open in the **system browser**.
- Internal `esimmongolia.com` paths stay inside the WebView.

---

## Prerequisites

- **Node.js 18+** and npm
- **Android Studio** (Android SDK 34+, JDK 17)
- **Xcode 15+** (macOS, for iOS)
- **Apple Developer** + **Google Play Console** accounts for store release
- **Firebase project** (FCM push notifications)

---

## Quick start

```bash
# 1. Install dependencies (repo root)
npm install

# 2. Copy static site into www/ and inject mobile scripts
npm run www:sync

# 3. Add native platforms (first time only)
npx cap add android
npx cap add ios

# 4. Generate app icon + splash from resources/*.svg
npm run assets:generate

# 5. Sync web + native projects
npm run cap:sync

# 6. Open IDE
npm run cap:open:android
npm run cap:open:ios
```

Verify setup files:

```bash
npm run verify:mobile
```

---

## Build commands

| Command | Description |
|---------|-------------|
| `npm run www:sync` | Copy site → `www/`, inject mobile JS/CSS |
| `npm run cap:sync` | www:sync + `cap sync` |
| `npm run assets:generate` | Icons/splash from `resources/` |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode |
| `npm run build:android:debug` | Debug APK (after Android Studio setup) |

**Do not deploy to production or change live data until debug/release builds pass.**

---

## Android setup

### 1. Permissions (`android/app/src/main/AndroidManifest.xml`)

After `cap add android`, ensure these exist inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

Location is requested **only when a feature needs it** (via `ESMCapacitor.requestLocationPermission()`).

### 2. Firebase (FCM)

1. Create Firebase project → add Android app `com.esimmongolia.app`
2. Download `google-services.json` → place in `android/app/`
3. In `android/build.gradle` and `android/app/build.gradle`, apply Google services plugin per [Capacitor Push docs](https://capacitorjs.com/docs/apis/push-notifications)

### 3. Deep links (App Links)

1. Build release keystore and note SHA-256 fingerprint
2. Update `public/.well-known/assetlinks.json` with your fingerprint
3. Deploy website (Netlify serves `public/.well-known/`)
4. In `AndroidManifest.xml` add intent-filter for `https://esimmongolia.com`

### 4. Back button

Handled in `js/capacitor-app.js`: closes modals → `history.back()` → double-tap to exit.

---

## iOS setup

### 1. Xcode capabilities

- **Push Notifications**
- **Associated Domains**: `applinks:esimmongolia.com`
- **Camera** / **Photo Library** usage strings in `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>QR код уншихад камер ашиглана</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>QPay QR зураг хадгалахад ашиглана</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Ойролцоо буудал, үзвэр харуулахад байршил ашиглана</string>
```

### 2. Firebase

1. Add iOS app in Firebase → download `GoogleService-Info.plist`
2. Add to `ios/App/App/` in Xcode
3. Enable Push in Apple Developer → APNs key → upload to Firebase

### 3. Universal Links

1. Replace `TEAMID` in `public/.well-known/apple-app-site-association` with your Apple Team ID
2. Deploy site; verify with [Apple validator](https://search.developer.apple.com/appsearch-validation-tool/)

### 4. Safe areas / notch

- `viewport-fit=cover` on main pages
- `css/capacitor-mobile.css` uses `env(safe-area-inset-*)`
- Capacitor `ios.contentInset: automatic` in `capacitor.config.json`

---

## Mobile UX features

| Feature | Implementation |
|---------|----------------|
| Bottom navigation | `js/capacitor-app.js` — fixed nav on native only |
| Pull-to-refresh | Search/eSIM sections only (touch gesture) |
| Offline screen | Full-screen overlay when network is down |
| Network errors | Top banner via `window.esmShowNetworkError()` |
| External URLs | `Capacitor Browser` / system browser |
| QPay / payments | Opened externally; return via `?app_payment=success&orderId=` |
| Save QR | `ESMCapacitor.saveQrToGallery(dataUrl)` |
| Camera QR | `ESMCapacitor.requestCameraPermission()` |

---

## Deep links

Supported URL patterns (open inside app):

- `https://esimmongolia.com/`
- `https://esimmongolia.com/?tab=hotel`
- `https://esimmongolia.com/china.html`
- `https://esimmongolia.com/?app_payment=success&orderId=ORD-123`
- Custom scheme: `esimmongolia://path`

---

## Push notifications

1. App registers via `@capacitor/push-notifications`
2. Token POSTed to `/.netlify/functions/push-register`
3. Optional Supabase table (run when ready, **not required for build**):

```sql
create table if not exists public.push_tokens (
  token text primary key,
  platform text,
  app_id text,
  updated_at timestamptz default now()
);
```

FCM **server** keys stay in Netlify env / Firebase Admin — never in the app.

---

## Sessions & payments

- **AI chat session** (`sessionStorage` / `localStorage`) persists in WebView after app restart.
- **Saved attractions**, itinerary, admin keys use same storage APIs as web.
- **QPay**: payment UI opens in system browser; configure QPay callback/return URL to  
  `https://esimmongolia.com/?app_payment=success&orderId={orderId}`  
  App route handled in `capacitor-app.js`.

---

## Security checklist

- [x] Supabase service role, OpenAI, TGT, QPay credentials only in Netlify env
- [x] `js/api-config.js` proxies API to production origin on native
- [x] `google-services.json` / `GoogleService-Info.plist` gitignored — add locally
- [x] No new secrets added to frontend bundle

---

## Project files

| Path | Purpose |
|------|---------|
| `capacitor.config.json` | App ID, splash, plugins |
| `package.json` | Capacitor deps + scripts |
| `scripts/sync-www.mjs` | Build `www/` from static site |
| `js/api-config.js` | Native API base URL |
| `js/capacitor-app.js` | Native bridge |
| `css/capacitor-mobile.css` | Safe areas, bottom nav |
| `resources/icon.svg` | App icon source |
| `resources/splash.svg` | Splash source |
| `public/.well-known/*` | Android/iOS deep links |
| `netlify/functions/push-register.js` | FCM token endpoint |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 404 in app | Run `npm run www:sync`; confirm `api-config.js` loads first |
| Blank WebView | `npm run cap:sync`; check `www/index.html` exists |
| Push not working | Add Firebase configs; enable push capability in Xcode |
| Deep links open browser | Update `assetlinks.json` SHA-256; deploy `.well-known` |
| Gradle fails | JDK 17, Android SDK 34, `npx cap sync` |

---

## Release checklist (before production deploy)

1. `npm run verify:mobile`
2. `npm run www:sync && npm run cap:sync`
3. Debug build on physical Android + iOS device
4. Test: eSIM order, QPay flow, hotel/attraction search, AI chat
5. Test: offline screen, back button, external Klook link
6. Test: deep link `https://esimmongolia.com/?tab=attraction`
7. Replace placeholder SHA-256 / TEAMID in `.well-known` files
8. Signed release build → Play Store / App Store

---

© eSIM Mongolia — same codebase powers web and mobile.
