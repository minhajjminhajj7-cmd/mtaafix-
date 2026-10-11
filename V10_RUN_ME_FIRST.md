# MtaaFix V10 - Run Me First

## 1. Install dependencies

Backend:

```bash
cd ~/development/mtaafix/backend
npm install
```

Web:

```bash
cd ~/development/mtaafix/admin_portal
npm install
```

Mobile:

```bash
cd ~/development/mtaafix/mobile
flutter pub get
```

## 2. Upgrade the existing database

Keep your existing `mtaafix` database. Do not drop it.

```bash
cd ~/development/mtaafix
PGOPTIONS='-c search_path=public' psql mtaafix -f backend/src/db/20261011_v10_full_upgrade.sql
```

## 3. Start backend

```bash
cd ~/development/mtaafix/backend
node src/server.js
```

## 4. Build and start web portal

```bash
cd ~/development/mtaafix/admin_portal
npm run build
npm run dev
```

Open `http://localhost:5173`.

## 5. Analyze and run mobile

```bash
flutter emulators --launch Pixel_10_Pro_XL
flutter devices
cd ~/development/mtaafix/mobile
flutter analyze
flutter run -d emulator-5554
```

Use the actual Android device ID shown by `flutter devices` if it is not `emulator-5554`.

## 6. Verification

With the backend running:

```bash
cd ~/development/mtaafix
./scripts/verify-v10.sh
./scripts/verify-v10-workflow.sh
```

## Test accounts

Super Admin: `admin@mtaafix.test` / `Admin1234`

Electrical Department: `electrical@mtaafix.test` / `Electrical1234`

Citizen: `minhajj@mtaafix.test` / `Test1234`
