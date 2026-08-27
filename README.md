# AI Fitness Plan Generator 

An automated fitness planning application powered by n8n, OpenAI, Google Sheets, and a custom web frontend.

## 📌 Project Overview
This project automates user onboarding, authentication, and tailored fitness plan generation using n8n workflows:
- **Registration Workflow:** Captures new user credentials and logs them to Google Sheets.
- **Login Workflow:** Validates user sessions for application access.
- **Fitness Plan Generator:** Integrates with OpenAI to create customized diet and workout plans based on user profiles.

## 📁 Repository Structure
```text
AI-Fitness-Plan-Generator/
├── n8n-workflows/
│   ├── registration.json
│   ├── login.json
│   └── fitness-plan-generator.json
└── README.md
