# Baryalai — AI Fitness Plan Generator

Baryalai (بریالی) is a full-stack AI fitness portfolio project built with a React/Vite frontend and three n8n workflows for registration, login, and personalized fitness-plan generation.

## What is included

- Premium responsive Baryalai frontend
- Real n8n registration flow
- Real n8n login validation
- AI fitness-plan generation through n8n + OpenAI
- Google Sheets persistence in the n8n workflows
- Browser session caching for the authenticated user and latest generated plan
- Print / Save PDF support from the plan dashboard
- No fake login or silent local fallback if n8n fails

## Repository structure

```text
AI-Fitness-Plan-Generator/
├── n8n-workflows/
│   ├── registration.json
│   ├── login.json
│   └── fitness-plan-generator.json
├── src/
│   ├── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture

```text
Browser / React
   |-- Register ---> n8n Registration ---> Google Sheets Users
   |-- Login ------> n8n Login ----------> Google Sheets Users
   `-- Assessment -> n8n Fitness --------> OpenAI + Google Sheets
                                           |
                                           `-> AI coaching plan
```

## Run locally

### 1. Install Node.js

Use Node.js 18 or newer.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure n8n production webhooks

Copy the environment template:

```bash
cp .env.example .env.local
```

Then replace the placeholders with the **production** webhook URLs from the three active n8n workflows:

```env
VITE_REGISTER_WEBHOOK_URL="https://YOUR-N8N-HOST/webhook/YOUR-REGISTRATION-PATH"
VITE_LOGIN_WEBHOOK_URL="https://YOUR-N8N-HOST/webhook/YOUR-LOGIN-PATH"
VITE_FITNESS_WEBHOOK_URL="https://YOUR-N8N-HOST/webhook/YOUR-FITNESS-PATH"
```

Do not use `/webhook-test/` URLs for the deployed site.

### 4. Start the frontend

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## n8n workflow setup

Import the three JSON files from `n8n-workflows/`. On a different n8n instance you may need to reconnect the Google Sheets and OpenAI credentials and verify the sheet/tab mappings before activation.

The frontend expects these successful response shapes.

### Registration

```json
{
  "status": "Success",
  "message": "User registered successfully",
  "userId": "..."
}
```

### Login

```json
{
  "status": "Success",
  "message": "Login successful",
  "user": {
    "userId": "...",
    "fullName": "...",
    "email": "..."
  }
}
```

### Fitness plan

```json
{
  "status": "Success",
  "message": "Fitness plan generated successfully",
  "planId": "...",
  "userId": "...",
  "fitnessPlan": "..."
}
```

## Important security note

This is a portfolio / learning implementation. The tested registration workflow currently stores passwords in Google Sheets in plain text. That is **not appropriate for a production authentication system**. A production release should use a real authentication provider or secure password hashing, a proper database, rate limiting, and protected backend endpoints.

No `.env.local` file, API key, or credential secret should be committed to this repository.
