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
*   An AI API Key (OpenAI, Claude, Gemini, etc.) from a provider with an OpenAI-compatible API endpoint.

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

Create a `.env.local` file in the root of the project and add your AI API Key:

```ini
# Required: Your API Key from OpenAI, Anthropic, Google, etc.
AI_API_KEY=your_api_key_here

# Optional: Override the default AI API endpoint (defaults to OpenAI)
# Example for a local model server:
# AI_API_ENDPOINT=http://localhost:1234/v1/chat/completions

# Optional: Override the default model (defaults to gpt-3.5-turbo)
# AI_MODEL=gpt-4-turbo
```

**Important:** The `.env.local` file is listed in `.gitignore` and should **never** be committed to version control.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How to Use

1.  Launch the application locally (`npm run dev`).
2.  Fill in the project details in the web UI.
3.  Optionally, describe your intended technology stack.
4.  Select the rules, specifications, and checklist you want to generate.
5.  Click "Create Starter Kit".
6.  The application will use your API key to generate the content via the configured AI endpoint.
7.  Once complete, a `.zip` file containing the structured starter kit will be downloaded by your browser.
8.  Unzip the file into your new project directory and start working with Cursor!

## Project Structure Output

The generated `.zip` file will contain the following structure:

```
/
├── .cursor/
│   └── rules/
│       ├── general-best-practices.mdc
│       ├── logging-and-debugging.mdc
│       ├── tdd-and-testing.mdc
│       ├── github-commit-discipline.mdc
│       ├── scalability.mdc
│       ├── mcp-tools.mdc
│       └── project-specific-rules.mdc  # Generated
├── docs/
│   ├── prd.md                       # Generated (if selected)
│   ├── tps.md                       # Generated (if selected)
│   ├── ui-ux-spec.md                # Generated (if selected)
│   ├── technical-spec.md            # Generated (if selected)
│   ├── data-spec.md                 # Generated (if selected)
│   └── integration-spec.md          # Generated (if selected)
└── checklist.md                     # Generated (if selected)
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
