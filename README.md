# CAPS - Cursor Agent Project Starter

This open-source app provides a local UI for developers to generate and manage starter kits for their Cursor projects.

A starter kit includes technical documentation (as markdown files), Cursor-compatible rules, and a checklist of tasks for the Cursor agent.
The goal is to enable developers to go from project idea to implementation with clearly defined specs, agent rules, and actionable tasks—all structured for AI-assisted development inside Cursor.

## Features

*   Simple web UI to describe your project.
*   Define project details (description, problem, features, target users).
*   Specify your intended tech stack (optional, AI can infer).
*   Select which artifacts to generate:
    *   Project-specific Cursor rules (`.cursor/rules/*.mdc`)
    *   Technical specifications (PRD, TPS, UI/UX, Tech, Data, Integration - `docs/*.md`)
    *   Task checklist (`checklist.md`)
*   Generates content using AI (configurable provider via API key/endpoint).
*   Exports the complete starter kit as a `.zip` archive.

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   An API Key from your chosen AI provider (OpenAI, Google AI, or Anthropic).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd caps
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Variables

Create a `.env.local` file in the root of the project. Add the API key for the provider you want to use.

You can optionally specify the provider and model names.

```ini
# --- Provider Selection (Optional) ---
# Explicitly set the provider ('openai', 'google', 'anthropic').
# If not set, the app will try to detect the provider based on which API key is present
# (checking for ANTHROPIC_API_KEY, then GOOGLE_API_KEY, then OPENAI_API_KEY).
# AI_PROVIDER=openai

# --- API Keys (Add the key for your chosen provider) ---
OPENAI_API_KEY=
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=

# --- Model Names (Optional - Defaults are usually suitable) ---
# OPENAI_MODEL_NAME=gpt-4-turbo
# GEMINI_MODEL_NAME=gemini-1.5-pro-latest
# CLAUDE_MODEL_NAME=claude-3-opus-20240229

# --- OpenAI Specific Base URL (Optional - For proxies or compatible APIs) ---
# OPENAI_API_BASE=
```

**Important:** You only need to provide the API key for the *one* provider you intend to use. The `.env.local` file is listed in `.gitignore` and should **never** be committed to version control.

### Running the Development Server

```