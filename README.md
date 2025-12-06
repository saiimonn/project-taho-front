# Project Overview
Project Taho is a Touhou-style bullet hell shooter built with React, Typescript, and Java Spring Boot.

## Features
* Player-controlled character with shooting and bomb mechanics
* Enemy waves with various movements and attack patterns
* Boss battles with multiple phases
* Score tracking with persistent high scores

## Technology Stack(Frontend)
<img src = "https://skills.syvixor.com/api/icons?perline=15&i=reactjs,typescript,tailwindcss,vite"/>

## Architecture
**File Structure**
```
src/
├── lib/
│   ├── game-types.ts       # Core classes and types
│   ├── game-engine.ts      # Game manager and logic
│   └── bullet-patterns.ts  # Pattern generation
├── components/
│   ├── game.tsx            # Main game component
│   ├── game-canvas.tsx     # Canvas renderer
│   ├── game-ui.tsx         # UI overlay
│   └── game-menu.tsx       # Menu screens
└── app/
    ├── App.tsx
    ├── provider.tsx
    └── router.tsx
```
---

## CIS 2103 Final Project
Developed by Charles Jade Argawanon, Simon Gabriel Gementiza, Jian Bryce Machacon, and Derick Angelo Yu