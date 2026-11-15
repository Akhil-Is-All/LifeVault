# LifeVault — Project Handover

## Project
LifeVault is a MERN-based personal reminder management SaaS application.

## Technology Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Authentication: JWT + bcrypt
- Notifications: Firebase Cloud Messaging (FCM)
- Frontend port: 5173
- Backend port: 5000

## Existing Features
- User registration and login
- JWT-protected routes
- Create, view, update and delete reminders
- Categories and due dates
- Search and filtering
- Completed and pending reminders
- Dashboard statistics
- Recurring reminders
- Browser notifications
- Firebase background push notifications
- Push registration and logout cleanup
- Backend reminder notification scheduler
- Notification delivery processing with retries

## Current Project Status

### Notification System
The Firebase notification system has been implemented and tested:
- FCM registration
- Backend push registration API
- Firebase Admin SDK
- Test push notifications
- Reminder notification planner
- Notification delivery processor
- Background service worker
- Logout registration cleanup

Avoid modifying notification logic during UI redesign.

### UI Redesign Progress

Day 25 — Application shell:
- Sidebar and topbar redesigned
- Responsive navigation
- LifeVault SVG logo created
- Compact tablet logo
- Favicon updated
- Responsive mobile drawer

Day 26 — Dashboard redesign:
- Work has started but may be incomplete because the previous Copilot session reached its monthly credit limit.
- First inspect the current files and existing modifications.
- Do not discard unfinished changes.
- Continue the Dashboard redesign from its current state.

## UI Roadmap
1. Day 25: Sidebar, topbar and logo — completed.
2. Day 26: Dashboard UI redesign — in progress.
3. Day 27: Reminders page UI redesign.
4. Day 28: Login, Register and public pages.
5. Day 29 onward: Document Vault foundation and implementation.

## Coding Instructions
- Inspect files before editing.
- Make small, controlled changes.
- Preserve existing working functionality.
- Do not rewrite the application shell unnecessarily.
- Do not change backend logic during UI tasks.
- Do not change authentication, APIs, Firebase or notification logic unless explicitly requested.
- Do not install packages automatically.
- If a dependency is needed, provide the exact install command and wait for me to run it.
- Run the frontend production build after changes:
  npm run build --prefix lifevault-frontend
- Do not claim browser testing unless actually performed.

## Working Style
I am building this project while preparing for a MERN developer job switch.

Explain changes in simple English, one task at a time. Give me practical steps and exact file names. I use VS Code and an AI coding agent.

Always inspect the current Git status and preserve existing work before editing.