# AI Fitness Plan Generator

A portfolio-ready AI automation project built with **n8n, OpenAI, Google Sheets, and a web frontend**. It covers user registration, login validation, and personalized fitness-plan generation through webhook-driven workflows.

## Project Workflows

- **Registration** — validates required fields, checks password length, prevents duplicate emails, creates a user record, and returns the registered user ID.
- **Login** — looks up the user by email, validates credentials, and returns the authenticated user profile.
- **Fitness Plan Generator** — validates fitness data, generates a personalized workout and meal plan with OpenAI, stores plan data, and returns the generated plan.

## Repository Structure

```text
AI-Fitness-Plan-Generator/
├── n8n-workflows/
│   ├── registration.json
│   ├── login.json
│   └── fitness-plan-generator.json
└── README.md
```

## Tech Stack

- n8n — workflow orchestration and webhooks
- OpenAI — AI-generated fitness plans
- Google Sheets — prototype data storage
- Web frontend — registration, login, and fitness-plan UI

## Importing the Workflows

1. Download a workflow JSON from `n8n-workflows/`.
2. In n8n, choose **Import from File**.
3. Reconnect your own Google Sheets and OpenAI credentials after import.
4. Verify sheet names/columns and webhook URLs before activation.
5. Test each workflow before connecting it to a production frontend.

## Security / Production Notes

This repository demonstrates an educational/prototype implementation. For a production application, passwords should be hashed and stored in a proper authentication/database system rather than stored as plain text in Google Sheets. Secrets and API keys are not intended to be committed to this repository.

## Status

The workflows are cleaned and organized for a polished portfolio release.
