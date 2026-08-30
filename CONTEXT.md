# PROJECT CONTEXT: Secret Service Web Platform

## 1. Brand Identity & Aesthetic
* **Brand Name:** Secret Service
* **Core Concept:** Experiential, covert deliveries (e.g., Secret Admirer letters, Soft Revenge boxes, Confession packages, Roast Your Friend kits, Office Prank kits).
* **Vibe:** Urban, high-stakes espionage, brick-and-mortar headquarters (NOT sci-fi/spaceships).
* **Primary Palette:** Deep Black (`#0A0A0A` / `#000000`), Crimson Red accents (`#DC2626` / `#EF4444` underglows/borders), Dark Gray, Gold/Brushed Brass (accents/plaques).
* **Agent Representation:** Black South African ethnicity; formal agent attire (Male: black suit, white shirt, black tie, sunglasses, earpiece; Female: black suit with skirt, white shirt, sunglasses, earpiece).
* **Logo:** Monogram featuring an 'S' slashed by a sharp diagonal line.

## 2. Tech Stack & Architecture
* **Build Tool:** Vite (ES Modules, multi-page rollup config)
* **Framework:** Vanilla JS (or React, modular component structure)
* **Styling:** Tailwind CSS / CSS Modules (Dark mode default, glassmorphism, glowing borders)
* **Animations:** GSAP + ScrollTrigger (imported via NPM, no CDNs)
* **Backend / Database:** Firebase v10+ SDK (Modular import in `/src/firebase.js`)
  * **Auth:** User login/signup ready
  * **Firestore:** Collection `dispatches` linked to order form
  * **Config:** Environment variables via `import.meta.env.VITE_FIREBASE_*` (using mock keys initially)

## 3. Site Navigation & File Structure
Multi-page architecture with shared sticky navigation header (`HOME`, `THE DIRECTIVE`, `DOSSIERS`, `PROTOCOL`, `CONTACT`):

├── index.html          # Hero (Agent HQ entrance), Dossier preview carousel, 3-Step Protocol
├── about.html          # THE DIRECTIVE (Ethos, anonymity, agent team history)
├── dossiers.html       # DOSSIERS (3x3 grid of all product categories + customization modals)
├── protocol.html       # PROTOCOL (In-depth step-by-step dispatch workflow)
├── contact.html        # CONTACT (Encrypted Dispatch order form terminal + HQ details)
├── src/
│   ├── firebase.js     # Firebase init & Firestore export
│   ├── main.js         # GSAP animation controllers & scroll logic
│   └── styles/         # Custom Tailwind / glowing UI CSS
├── vite.config.js      # Multi-page Rollup entry configuration
└── package.json        # Dependencies (vite, gsap, firebase)

## 4. UI Components & Key Elements
1. **Hero Section (`/index.html`):** Dark urban HQ brick entrance, brass logo plaque ("SECRET SERVICE EST. 1952"), reinforced industrial door, two agents. Headline: *DELIVERED IN CONFIDENCE.* Primary CTA: `[ INITIATE DISPATCH ]`.
2. **Classified File Cards (`/dossiers.html`):** Dark folder aesthetic with hover effects, `[ VIEW FILE ]` / `[ ADD TO DISPATCH ]` triggers opening a detail modal.
3. **Encrypted Terminal Form (`/contact.html`):** Inputs with thin glowing red borders (`AGENT IDENTIFIER`, `TARGET DOSSIER SELECT`, `MESSAGE PAYLOAD`, `DELIVERY COORDINATES`) + `[ SUBMIT ORDER ]` CTA connected to Firestore.