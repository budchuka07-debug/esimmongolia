# Android native configuration (after `npx cap add android`)

Apply these changes in Android Studio if not already present.

## AndroidManifest.xml — Deep link intent-filter

Inside `<activity android:name=".MainActivity">`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="esimmongolia.com" />
    <data android:scheme="https" android:host="www.esimmongolia.com" />
</intent-filter>
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="esimmongolia" />
</intent-filter>
```

## build.gradle (project)

```gradle
classpath 'com.google.gms:google-services:4.4.2'
```

## build.gradle (app)

```gradle
apply plugin: 'com.google.gms.google-services'
```

Place `google-services.json` in `android/app/`.

## strings.xml

```xml
<string name="app_name">eSIM Mongolia</string>
```
