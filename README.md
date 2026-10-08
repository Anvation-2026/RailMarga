# RAILMARGA (ರೈಲುಮಾರ್ಗ)
### Smart, Accessible & AI-Powered Indoor Navigation for KSR Bengaluru Railway Station
**Tagline:** *"Smart & Accessible Navigation for KSR Bengaluru"*

---

## 🚆 Overview

**RailMarga** is a production-grade, offline-first indoor navigation mobile application engineered specifically for **Krantivira Sangolli Rayanna (Bengaluru Railway Station) — KSR / SBC**.

It addresses the fundamental spatial challenges faced by passengers in India's busiest transit hubs:
- **100% Offline-First Navigation:** Operates deterministically without cellular reception, internet, or cloud APIs inside underground subways, tunnels, and deep platform concourses.
- **5 Personalized Accessibility Profiles:** Tailored routing costs and directions for First-Time Travellers, Elderly Persons, Children, Visually Impaired passengers, and Mobility-Disabled (Wheelchair) users.
- **Dynamic Blockage & Live Rerouting:** Automatically detects blocked lifts, escalators, ramps, or corridors and recalculates optimal alternative routes in real-time.
- **Grounded Gemini AI Assistant:** Server-side natural language understanding that communicates exclusively through deterministic spatial tools without hallucinating station infrastructure.
- **Indoor QR Checkpoint Localization:** High-precision indoor location anchoring using physical station pillar QR codes.
- **High-Performance 60 FPS Mobile Map:** Renders the actual KSR Bengaluru station layout with responsive pan, zoom, route overlays, and status indicators.

---

## 1. System Requirements

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Python:** 3.10+ (for geometric preprocessing scripts)
- **Package Manager:** npm or yarn
- **Mobile Development:** Expo CLI (`npx expo`), Android Studio or Expo Go app on an Android device

---

## 2. Project Architecture

```text
METEOR/
├── data/
│   ├── source/               # Original CSV, JSON, and SVG files
│   ├── station/              # Normalized station models (platforms, facilities, nodes, edges)
│   ├── accessibility/        # profiles.json, routingConfig.json
│   └── simulation/           # checkpoints.json, status.json
├── docs/                     # DATA_ANALYSIS.md, ARCHITECTURE.md, GRAPH_DESIGN.md, IMPLEMENTATION_PLAN.md
├── scripts/                  # Data extraction, graph construction, validation
├── server/                   # Express Backend & Grounded Gemini Assistant
│   ├── src/
│   │   ├── algorithms/       # A* and Dijkstra routing engines
│   │   ├── services/         # Station and facility query services
│   │   ├── tools/            # Gemini AI tool calling
│   │   └── index.ts          # Express API server
│   └── .env                  # Port & Gemini API Key
└── mobile/                   # React Native Expo Mobile Application
    ├── src/
    │   ├── components/       # KsrMap, NavigationBanner, ProfilePicker, BlockageModal
    │   ├── screens/          # HomeScreen, PlatformDetail, FacilityFinder, AssistantChat, QrScan
    │   ├── services/         # localRouter (offline A*), apiService, voiceService
    │   ├── store/            # Zustand navigationStore, blockageStore
    │   └── data/             # Bundled station dataset for 100% offline autonomy
    ├── App.tsx               # Main mobile application controller
    └── app.json              # Android EAS configuration
```

---

## 3. Environment Variables

Create `server/.env`:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

> **Security Note:** The Gemini API key is **never** embedded or bundled inside the mobile client. All AI requests pass through the Express backend. If no API key is provided, RailMarga automatically falls back to its built-in deterministic NLP engine.

---

## 4. Data Preprocessing & Validation

To rebuild and validate the station graph from source CAD data:

```bash
# Generate normalized station models & graph
npm run build:data

# Run graph validation and reachability tests
npm run validate-data
```

Validation verifies:
- 0 disconnected components
- 0 orphan nodes
- 100% reachability across Platforms 1 to 10
- Step-free wheelchair compliance from Terminal 1 to Platform 8

---

## 5. Starting the Backend Server

```bash
cd server
npm install
npm run build
npm start
```

The Express API starts on `http://localhost:3000`.

### Core API Endpoints:
- `GET /api/station`: Station overview, levels, and bounds
- `GET /api/platforms`: Platforms 1 to 10 details and nearest facilities
- `GET /api/facilities`: Restrooms, lifts, ramps, ticket counters
- `GET /api/status`: Operational status of lifts and ramps
- `POST /api/status`: Update facility status (simulate blockage)
- `POST /api/route`: Compute optimal route for any accessibility profile
- `POST /api/reroute`: Compute alternative route avoiding blockages
- `POST /api/assistant`: Grounded Gemini AI conversational navigation
- `POST /api/checkpoint`: Resolve QR code to physical station node

---

## 6. Starting the Mobile Application

```bash
cd mobile
npm install
npx expo start
```

- Press `a` to open in an Android Emulator.
- Or scan the terminal QR code using the **Expo Go** app on your physical Android phone.

---

## 7. Offline Mode vs. Online Mode

### Offline Mode (Default / Zero Connectivity):
- Disconnect Wi-Fi and Mobile Data on the phone.
- The app automatically displays **● Offline Mode**.
- $A^*$ routing, platform search, turn-by-turn guidance, voice navigation, and QR checkpoints execute locally in `< 5ms`.

### Online Mode:
- When connected to the Express backend, the app displays **● Online**.
- Enables live facility status syncing and conversational Gemini AI assistant.

---

## 8. Five Personalized Accessibility Profiles

1. **🧭 First-Time Traveller:**
   - Simple paths, major visual landmarks (Ticket Counter, Main Concourse, FOB), minimal turns.
2. **🚶‍♂️ Elderly Person:**
   - Minimal walking distance, high penalty on stairs (+5x), strongly prefers lifts and ramps.
3. **🧒 Child / Kid:**
   - Simplified vocabulary, avoids complex junctions, landmarks with recognizable colors.
4. **🦯 Visually Impaired:**
   - Audio-first navigation, prefers tactile corridors, fewest turns, step-by-step auditory landmarks.
5. **♿ Mobility Disability (Wheelchair):**
   - **100% Step-free.** Stairs and escalators are strictly prohibited ($\infty$ cost). Prefers accessible Lifts and 1:12 Ramps.

---

## 9. Hackathon Demo Scenarios

Open the app and tap the **⚡ Demo** button in the top right to access the **Judge Sandbox**:

1. **Scenario 1 (First-Time Traveller):**
   - Tap `1. First-Time` $\to$ Calculates landmark-guided path to Platform 8.
2. **Scenario 2 (Wheelchair User):**
   - Tap `2. Wheelchair` $\to$ Calculates 100% step-free path via Lift 2 / Ramps $\to$ FOB 2 $\to$ Lift 1 $\to$ Platform 8.
3. **Scenario 3 (Elderly Person):**
   - Tap `3. Elderly` $\to$ Calculates low-fatigue route to Platform 5.
4. **Scenario 4 (Visually Impaired):**
   - Tap `4. Visually Impaired` $\to$ Audio-first guidance to Platform 8.
5. **Scenario 5 (Live Blockage & Dynamic Rerouting):**
   - Tap `5. Live Blockage Simulation` $\to$ Starts navigation to Platform 8 $\to$ Simulates Lift 1 becoming `BLOCKED` $\to$ Emits warning: *"⚠️ Lift 1 blocked. Recalculating route..."* $\to$ Reroutes via Platform 7/8 Accessible Ramp!

---

## 10. Building the Android APK

To build a standalone installable Android APK:

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Configure build profile
eas build:configure

# Build standalone Android APK
eas build -p android --profile preview
```

Or generate a local Android project:
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```
The APK will be generated in `android/app/build/outputs/apk/release/app-release.apk`.

---

## 11. Troubleshooting

- **Map not panning/zooming:** Ensure touch is within the map viewport; use the floating `+` and `-` zoom buttons.
- **Network indicator says Offline Mode:** If testing on Android Emulator, the backend is reached at `http://10.0.2.2:3000`. On a physical phone, set your PC's local LAN IP in `mobile/src/services/apiService.ts`.
- **Speech not speaking:** Verify device volume is on; `expo-speech` uses native Android TTS engine.

---

## 12. Verification & Test Suite

Run the automated backend test suite:
```bash
cd server
node dist/test_endpoints.js
```
Expected output:
```text
=== RUNNING BACKEND UNIT & INTEGRATION TESTS ===
[PASS] Station: Krantivira Sangolli Rayanna (Bengaluru Railway Station) (10 platforms, 75 nodes)
[PASS] Platform 8: Platform 8 at center (1450, 375.9)
[PASS] Wheelchair route to PF8: 661.6m, step-free: true
[PASS] Dynamic reroute (Lift 1 blocked) via Ramp: 732.9m
[PASS] Nearest toilet: Terminal 1 Concourse Restroom (60.1m)
[PASS] QR Checkpoint resolved: Terminal 1 Main Entrance Checkpoint -> Node: node_entry_t1_main_east
[PASS] Assistant reply: "I have calculated a step-free accessible route to Platform 8..."
====================================================
✅ ALL BACKEND AND ROUTING TESTS PASSED (7/7)!
====================================================
```
