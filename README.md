# Shift Tracker (Android)

## Option A: build in the cloud (no Android Studio)
1. Create a free GitHub account and a new repository.
2. Upload everything in this folder to it (keep the .github folder).
3. Open the repo's Actions tab, choose "Build APK", then Run workflow.
4. When it turns green (about 5 minutes), open the run and download "shift-tracker-apk".
5. Unzip it, send app-debug.apk to your phone and install it (allow "install unknown apps" when asked).

## Option B: Android Studio
1. Install Node.js and Android Studio.
2. In this folder run: npm install, then: npx cap sync android
3. Open the "android" folder in Android Studio, wait for Gradle sync.
4. Build > Build Bundle(s) / APK(s) > Build APK(s). Copy app-debug.apk to your phone.

The app UI lives in www/index.html and works offline (fonts are bundled).

## Updating later
Upload the changed files to the same repo (commit to main). The build runs again; install the new APK over the old one. Your data is kept because every build is signed with the same key (android/app/shifttracker.keystore). Never uninstall the app first, and use Config > Backup before big updates.
