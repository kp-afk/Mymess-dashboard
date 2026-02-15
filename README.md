
# MyMess Admin Dashboard Setup Guide

Follow these steps to run the dashboard on your laptop with your live Firebase data.

### Step 1: Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named **MyMess**.
3. **Enable Authentication**: Go to Build > Authentication > Get Started. Enable "Email/Password".
4. **Enable Firestore**: Go to Build > Firestore Database. Click "Create Database". Start in **Test Mode**.
5. **Enable Realtime Database**: Go to Build > Realtime Database. Click "Create Database".
6. **Register App**: Click the Gear icon (Project Settings). Under "Your apps", click the `</>` icon. Give it a name and copy the `firebaseConfig` object.

### Step 2: Apply Security Rules
1. **Firestore**: Copy the Firestore rules you provided. Go to Firestore > Rules and paste them.
2. **Realtime Database**: Copy the RTDB rules you provided. Go to Realtime Database > Rules and paste them.

### Step 3: Configure the App
1. Open `lib/firebase.ts`.
2. Replace the placeholder values in the `firebaseConfig` object with the real keys you copied in Step 1.6.

### Step 4: Local Installation
1. Ensure you have **Node.js** installed.
2. Create a folder for the project and place the files inside.
3. Open your terminal in that folder and run:
   ```bash
   # If using Vite (recommended)
   npm install
   npm run dev
   ```
   *Note: Since this app uses ES Modules from `esm.sh`, you can also simply serve the folder using a static server like `npx serve` or Live Server in VS Code.*

### Step 5: Setup Admin User
The security rules require an `admins` collection.
1. Go to Firebase Console > Firestore.
2. Create a collection named `admins`.
3. Add a document where the **Document ID** is your Firebase User UID (found in the Authentication tab after you sign up) and add a field `role: "admin"`.

### Data Schema Reference
- **RTDB**: `attendance/{yyyy-mm-dd}/{meal}/{uid}: true`
- **Firestore**: `complaints/{id}` and `mealRatings/{id}`
