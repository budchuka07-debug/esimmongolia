# iOS native configuration (after `npx cap add ios`)

## Info.plist — URL types

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>esimmongolia</string>
    </array>
  </dict>
</array>
```

## Associated Domains (Xcode → Signing & Capabilities)

```
applinks:esimmongolia.com
applinks:www.esimmongolia.com
```

## App display name

`CFBundleDisplayName` = `eSIM Mongolia`

Add `GoogleService-Info.plist` to the App target.

Push Notifications capability required for FCM.
