# Classroom Hub

Classroom Hub is a full-stack classroom management platform built for teachers and students. It combines classroom organization, announcements, assignments, doubts, chat, live classes, and file sharing in a single application.

This repository contains:

- `server/`: NestJS backend API, websocket gateways, and real-time/live session services
- `web/`: React frontend built with Vite, TypeScript, Tailwind CSS, and shadcn/ui

## Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Role-Based Capabilities](#role-based-capabilities)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Available Scripts](#available-scripts)
- [Key Modules](#key-modules)
- [Current Notes](#current-notes)
- [Roadmap / Future Documentation](#roadmap--future-documentation)

## Project Overview

Classroom Hub is designed to support everyday classroom workflows for both teachers and students:

- classroom creation and enrollment
- announcement and study material distribution
- assignment publishing and submission
- doubt discussion threads
- classroom chat
- live class sessions with moderation controls
- account/profile management

The application uses role-based access control so teachers and students see different actions and workflows while sharing the same platform.

## Core Features

The following features are reflected in the current codebase.

### Authentication and access control

- user signup and login
- JWT-based protected API access
- protected frontend routes
- teacher and student role separation
- password change support

### Classroom management

- teachers can create classrooms
- students can join classrooms with a join code
- users can view enrolled classrooms
- teachers can view classroom members
- teachers can remove students from a classroom
- students can leave a classroom
- teachers can delete classrooms

### Announcements, notes, and materials

- teachers can create classroom announcements
- announcements can include file attachments
- announcement comments are supported
- classroom streams can be viewed per class
- note/material listing is available from dedicated pages

### Assignments

- assignments are created through classroom announcement flows
- students can submit assignment files
- students can view pending, submitted, and missed assignments
- teachers can view submitted work
- teachers can view which students are still pending for a given assignment

### Doubts and discussion

- students can post doubts with attachments
- doubt threads support replies/messages
- teachers can review recent doubt activity
- classroom-level doubt history can be fetched with pagination support

### Chat and communication

- classroom chat is available in the student classroom view
- backend support exists for chat rooms, participants, message history, and file attachments
- websocket delivery is used for real-time chat updates
- mention-related event tracking is present in the dashboard/event layer

### Live classes

- teachers can start a live session for a classroom
- active sessions can be discovered per teacher or classroom
- students can request to join a live session
- teachers can approve participants from a waiting room
- raise hand / lower hand flows are supported
- teachers can moderate participants
- session chat/messages are supported
- teachers can remove participants and end sessions

### User settings

- profile basics/settings page
- avatar upload with image cropping on the frontend
- password change flow
- theme toggle support
- responsive desktop/mobile navigation

## Role-Based Capabilities

### Teacher

- create classrooms
- manage classroom rosters
- create announcements and upload files
- publish notes/materials and assignments
- review student submissions
- monitor classroom doubts
- host and moderate live classes

### Student

- join classrooms using join codes
- browse classroom updates and materials
- submit assignments
- ask doubts and participate in thread discussions
- join chat and live sessions
- manage account settings

## Architecture Overview

### Frontend

The frontend is a React single-page application using route protection and role-aware UI flows. It includes:

- dashboard pages
- classroom pages and tabbed views
- notes/materials and assignment pages
- auth pages
- live class pages and overlays
- settings/profile screens

### Backend

The backend is a NestJS application organized by domain modules. It provides:

- REST APIs for auth, classrooms, assignments, doubts, events, files, and live sessions
- websocket gateways for chat and notifications/live session communication
- TypeORM-based persistence
- PostgreSQL database integration

### Real-time layer

The project uses:

- `socket.io` for chat and websocket events
- LiveKit integration for live classroom sessions

## Tech Stack

### Frontend

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Axios
- Zustand
- LiveKit client
- Socket.IO client

### Backend

- NestJS
- TypeORM
- PostgreSQL
- JWT authentication
- Socket.IO
- LiveKit server SDK
- Swagger support
- BullMQ dependencies present for notification/background job work

### File storage

The backend includes storage-related configuration for:

- Google Cloud Storage
- Cloudflare R2 / S3-compatible storage

## Project Structure

```text
classroom-hub/
|-- server/
|   |-- src/
|   |   |-- auth/
|   |   |-- assignments/
|   |   |-- chat/
|   |   |-- classrooms/
|   |   |-- doubts/
|   |   |-- event/
|   |   |-- fileServices/
|   |   |-- live-session/
|   |   |-- notification/
|   |   |-- users/
|   |-- livekit/
|   |-- scripts/
|
|-- web/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- types/
|
|-- readme.md
```

## Environment Configuration

This project has a small required env set, plus a few feature-dependent variables.

### Backend `.env`

Minimum required backend variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=your_jwt_secret
```

Required if you want file uploads to work:

```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_BUCKET_NAME=your-gcs-bucket-name
GCP_KEY_FILE=./gcp-key.json
```

Required if you want live classes to work:

```env
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
```

Optional variables:

```env
# Not currently required by the active backend bootstrap
FRONTEND_URL=http://localhost:5173

# Only needed if you later enable notification/queue infrastructure
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
REDIS_USERNAME=
REDIS_TLS=true

# Cloudflare R2 config exists in the codebase, but the current upload path
# used by FileService is Google Cloud Storage based
CF_ACCOUNT_ID=
CF_ACCESS_KEY_ID=
CF_SECRET_ACCESS_KEY=
CF_BUCKET_NAME=
```

Use `server/.env.example` as the base template.

Important notes:

- file uploads currently depend on Google Cloud Storage in `server/src/fileServices/file.service.ts`
- live-session token generation depends on `LIVEKIT_API_KEY`, `LIVEKIT_SECRET`, and `LIVEKIT_URL`
- Redis settings are present for notification/queue code, but `NotificationModule` is currently not enabled in `server/src/app.module.ts`
- `FRONTEND_URL` exists in the env template, but the current backend bootstrap enables CORS with `origin: true`, so it is not required right now

Recommended local backend `.env` for development:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=your-secret-key

GCP_PROJECT_ID=your-gcp-project-id
GCP_BUCKET_NAME=your-gcs-bucket-name
GCP_KEY_FILE=./gcp-key.json

LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
```

Files worth checking before production setup:

- `server/src/fileServices/`
- `server/src/live-session/services/`
- `server/livekit/`

### Frontend `.env.local`

```env
VITE_API_URL=http://localhost:3000
```

If frontend live-session behavior depends on additional env values in future, document them here as they are introduced.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Trinankur002/classroom-hub-.git
cd classroom-hub
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../web
npm install
```

### 4. Create backend env file

From `server/`, create `.env` based on `.env.example`.

Example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then update the values for your database, GCP bucket, and LiveKit setup.

### 5. Add Google Cloud service account key

If you want uploads to work, place your GCP service account JSON file in `server/` and make sure `GCP_KEY_FILE` points to it.

Example:

```env
GCP_KEY_FILE=./gcp-key.json
```

## LiveKit Setup

Live classes in this project require a running LiveKit server.

The repo currently includes:

- `server/livekit/livekit.yaml`
- `server/livekit/Dockerfile`
- `server/livekit/start-livekit.js`
- `server/livekit/stop-livekit.js`
- a Windows binary workflow via `server/livekit/livekit-server.exe`

The bundled `livekit.yaml` uses these dev credentials:

```yaml
keys:
  devkey: secret
```

So the matching backend env values are:

```env
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
```

### Option 1: Windows local setup using the bundled binary

This is the setup most aligned with the current repo.

1. Confirm `server/livekit/livekit-server.exe` exists.
2. Keep `server/livekit/livekit.yaml` as-is, or update it if you want different ports/keys.
3. Set backend env:

```env
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
```

4. Start the backend:

```bash
cd server
npm run start:dev
```

This will also run the LiveKit startup helper defined in `server/package.json`.

### Option 2: Docker setup on Windows, Linux, or macOS

If you prefer Docker instead of the bundled Windows binary:

1. Install Docker Desktop on Windows/macOS, or Docker Engine on Linux.
2. Open a terminal in `server/livekit/`.
3. Build the image:

```bash
docker build -t classroom-hub-livekit .
```

4. Run the container:

```bash
docker run --rm -p 7880:7880 -p 7881:7881 classroom-hub-livekit
```

5. Use the matching backend env:

```env
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
```

Notes:

- if you use Docker for LiveKit, do not rely on `npm run start:dev` to start the bundled Windows `.exe`
- on Windows, either use the bundled `.exe` workflow or Docker, not both at the same time

### Option 3: Manual native setup on Linux or macOS

For Linux/macOS, the repo does not include a native LiveKit binary. Use either Docker or install the LiveKit server binary manually for your OS.

General process:

1. Download the correct LiveKit server binary for your OS from the official LiveKit releases.
2. Place the binary somewhere on your machine.
3. Start it with this repo's config:

```bash
livekit-server --config server/livekit/livekit.yaml
```

4. Set backend env:

```env
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
```

If you use a different config, hostname, or port, update the env values to match.

## Running the Project

### Start the backend

From `server/`:

```bash
npm run start:dev
```

Backend default:

- API: `http://localhost:3000`

Note:

- on Windows, `npm run start:dev` also triggers the bundled LiveKit startup helper
- on Linux/macOS, use Docker or run a native LiveKit binary manually before starting the backend
- Swagger runs at `http://localhost:3000/api-docs`

### Start the frontend

From `web/`:

```bash
npm run dev
```

Frontend default:

- app: `http://localhost:5173`

## Available Scripts

### Backend scripts

From `server/`:

- `npm run build`: build the NestJS app
- `npm run dev`: run custom backend dev bootstrap script
- `npm run start:dev`: start backend in watch mode and run LiveKit startup script
- `npm run start:debug`: start backend in debug watch mode
- `npm run start:prod`: run compiled backend
- `npm run dev:livekit`: start LiveKit dev services
- `npm run stop:livekit`: stop LiveKit dev services

### Frontend scripts

From `web/`:

- `npm run dev`: start Vite dev server
- `npm run build`: build production bundle
- `npm run build:dev`: build in development mode
- `npm run lint`: run ESLint
- `npm run preview`: preview production build

## Key Modules

### Backend modules

- `auth`: login, signup, JWT strategy, password updates
- `users`: user entities and user service
- `classrooms`: classroom management, announcements, notes/materials, class membership
- `assignments`: submissions, pending/submitted/missed assignment tracking
- `doubts`: doubt creation and threaded doubt messaging
- `chat`: chat rooms, participants, messages, attachments, websocket delivery
- `event`: dashboard-oriented event feeds such as mentions, assignments, and doubt events
- `fileServices`: file upload and storage abstraction
- `live-session`: live classroom lifecycle and moderation
- `notification`: notification queue/gateway code present, but not fully wired in app imports

### Frontend areas

- `pages/`: top-level route screens
- `components/auth/`: login, signup, route guards
- `components/layout/`: app shell, sidebar, bottom navigation
- `components/customComponent/`: classroom-specific UI building blocks
- `components/live/`: live session UI, waiting room, controls, overlays
- `components/settings/`: account settings panels
- `services/`: API client wrappers for each domain

## Current Notes

- The documentation above is based on the current repository structure and source modules.
- Some capabilities are clearly implemented in code but may still need production hardening, deployment config, and end-to-end validation.
- The notification module exists in the backend, but `NotificationModule` is currently commented out in `server/src/app.module.ts`.
- TypeORM is configured with `synchronize: true`, which is convenient for development but should be reconsidered for production deployments.

## Roadmap / Future Documentation

This README is intended to be extended over time. Good next additions would be:

- screenshots or product walkthroughs
- API endpoint documentation summary
- database/entity relationship overview
- deployment guide
- environment variable reference
- contributor guide
- known limitations
- testing strategy

<!-- When you update the project later, keep this README current in these sections first:

1. `Core Features`
2. `Environment Configuration`
3. `Running the Project`
4. `Current Notes`
5. `Roadmap / Future Documentation` -->
