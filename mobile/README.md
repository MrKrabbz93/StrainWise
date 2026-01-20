# Mobile App Submission Guide 📱

## 🔗 Registration Portals
*   **Google Play Console** ($25 one-time): [https://play.google.com/console](https://play.google.com/console)
*   **Apple Developer Program** ($99/year): [https://developer.apple.com/programs/enroll/](https://developer.apple.com/programs/enroll/)

## 📦 Android (Play Store)

### 1. Build Signed Bundle
1.  Open `android/` folder in **Android Studio**.
2.  Go to **Build > Generate Signed Bundle / APK**.
3.  Select **Android App Bundle**.
4.  Create a new Key Store (Keep this safe! You cannot update the app without it).
5.  Build `release` variant.
6.  Upload `.aab` file to **Google Play Console**.

### 2. Store Metadata
-   **App Name:** StrainWise
-   **Short Description:** Find Medical Cannabis Stock Near You.
-   **Full Description:** StrainWise connects patients with real-time dispensary stock. Verified locations, live menus, and detailed strain information.

## 🍎 iOS (App Store)

### 1. Archive Build
1.  Open `ios/App/App.xcworkspace` in **Xcode**.
2.  Select "Any iOS Device (arm64)" as target.
3.  Go to **Product > Archive**.
4.  Once archived, click **Distribute App** -> **App Store Connect**.

### 2. Privacy Info
-   **Location Usage:** "Reason: To show dispensaries near the user."
-   **Data Collection:** No user tracking (unless analytics enabled).

## 🛠 Troubleshooting
If assets are missing:
`npm install @capacitor/assets --save-dev`
`npx capacitor-assets generate --android --ios`
