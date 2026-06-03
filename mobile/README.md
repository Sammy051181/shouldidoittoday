# Should I Do It Today? — Mobile App

Expo React Native companion app for [shouldidoittoday.com](https://shouldidoittoday.com).

## What it does

- Enter any location or use device GPS
- Choose an activity (cut grass, BBQ, camping, plants, dog walk, etc.)
- Get a clear **GO / CAUTION / WARNING** answer
- Real weather data from [Open-Meteo](https://open-meteo.com) — free, no API key needed
- Works in UK, Ireland, US, Canada, Australia, New Zealand

## Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)

## Install and run

```bash
cd mobile
npm install
npx expo start
```

This opens Expo Dev Tools. Then:

- **Expo Go (iOS/Android)**: scan the QR code in the Expo Go app
- **iOS Simulator**: press `i` in the terminal
- **Android Emulator**: press `a` in the terminal
- **Web browser**: press `w` in the terminal

## Run on web

```bash
npx expo start --web
```

## Type check

```bash
npm run typecheck
```

## Project structure

```
mobile/
  app/              # Expo Router screens
    _layout.tsx     # Root layout (SafeAreaProvider)
    index.tsx       # Home screen
    activities.tsx  # Activity selection
    result.tsx      # Decision result (also handles camping)
    plants.tsx      # Plant watering specialist screen
    bbq.tsx         # BBQ/grill specialist screen
    settings.tsx    # Settings & notifications
  src/
    components/     # Shared UI components
    constants/      # theme.ts — design tokens
    data/           # activities.ts, regions.ts
    logic/          # decisions.ts, bbqDecision.ts, plantDecision.ts, campingDecision.ts
    services/       # weather.ts (Open-Meteo), geocoding.ts, location.ts
    types/          # weather.ts, activities.ts
    utils/          # units.ts, date.ts
  assets/           # Place your logo.png, icon.png, splash.png here
  app.json
  package.json
  tsconfig.json
```

## Adding the logo

Place these files in `mobile/assets/`:
- `icon.png` — 1024×1024 square app icon
- `splash.png` — splash screen image
- `adaptive-icon.png` — Android adaptive icon foreground (1024×1024)
- `favicon.png` — web favicon (48×48)

The logo from the website (`/assets/should-i-do-it-today-logo.png`) can be used as the base.

## Build for production (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform ios    # or android
eas submit                   # submit to App Store / Play Store
```

## No secrets, no paid backend

- Weather: [Open-Meteo](https://open-meteo.com) — completely free, no API key
- Geocoding: Open-Meteo geocoding API + postcodes.io (UK) + zippopotam.us (ZIP codes)
- No login, no database, no Firebase, no paid services
- No `.env` file needed

## Limitations (v1)

- No offline support
- No push notifications (UI toggle exists, logic not wired to a push service)
- No saved locations persistence (would need AsyncStorage or a backend)
- Camping screen is accessed via the result screen (pass `activityKey=camping`)
