# App Store Submission Guide for StrainWise

This guide outlines the steps to build and submit StrainWise to the Google Play Store and Apple App Store.

## 🚀 Prerequisites

You have already completed the following steps (Automated):
- [x] iOS Platform Added
- [x] Android Platform Added
- [x] App Icons & Splash Screens Generated
- [x] PWA Icons Generated & Manifest Updated
- [x] Capacitor Configuration (`capacitor.config.ts`)

## 🤖 Android (Google Play Store)

### 1. Open Android Project
Run the following command in your terminal to open the project in **Android Studio**:
```bash
npx cap open android
```

### 2. Sign Your App
In Android Studio:
1.  Go to **Build > Generate Signed Bundle / APK**.
2.  Select **Android App Bundle**.
3.  Create a new Key Store (keep this safe!).
4.  Fill in the certificate details.
5.  Select **release** build variant.
6.  Click **Finish**.

### 3. Upload to Play Console
1.  Go to [Google Play Console](https://play.google.com/console).
2.  Create a new app "StrainWise".
3.  Upload the `.aab` file generated in step 2.
4.  Complete the store listing (Screenshots, Description, Rating).
5.  Submit for Review.

---

## 🍎 iOS (Apple App Store)

*Note: You need a Mac with Xcode installed for this step.*

### 1. Open iOS Project
Run the following command on your Mac:
```bash
npx cap open ios
```

### 2. Configure Signing
In Xcode:
1.  Select the **App** project in the navigator.
2.  Go to **Signing & Capabilities**.
3.  Select your **Team** (Apple Developer Account).
4.  Ensure "Automatically manage signing" is checked.

### 3. Build & Archive
1.  Select **Product > Archive**.
2.  Once built, the Archives organizer will open.
3.  Click **Distribute App**.
4.  Select **App Store Connect**.
5.  Follow the prompts to upload.

### 4. App Store Connect
1.  Go to [App Store Connect](https://appstoreconnect.apple.com/).
2.  Create a new app.
3.  Select the build you just uploaded.
4.  Fill in marketing data (Screenshots, Keywords).
5.  Submit for Review.

---

## 🌐 PWA (Progressive Web App)

Your app is also a fully functional PWA!
- **Manifest**: Located at `/manifest.json`.
- **Icons**: Optimized WebP icons in `/icons/`.
- **Service Worker**: `sw.js` handles offline caching.

Users can install it directly from the browser by clicking "Add to Home Screen".
