import { ProjectInputData, TechStack } from "@/types"; // Use correct ProjectInputData type

// Helper function to format tech stack details
function formatTechStack(techStack: Partial<TechStack>): string {
    let stackDetails = "";
    if (techStack.frontend) stackDetails += `Frontend: ${techStack.frontend}\n`;
    if (techStack.backend) stackDetails += `Backend: ${techStack.backend}\n`;
    if (techStack.database) stackDetails += `Database: ${techStack.database}\n`;
    if (techStack.infrastructure) stackDetails += `Infrastructure/Hosting: ${techStack.infrastructure}\n`;
    if (techStack.other) stackDetails += `Other Tools/Libraries: ${techStack.other}\n`;
    return stackDetails.trim() ? `The user specified the following tech stack:\n${stackDetails.trim()}` : "The user did not specify a tech stack; suggest one if appropriate based on the project.";
}

// --- LangChain Prompt Template Strings --- 

// Define input variables expected by each template
interface ProjectBaseInput {
    projectDescription: string;
    problemStatement: string;
    features: string;
    targetUsers: string;
    techStackInfo: string;
}

export const projectRulesTemplate = `
Generate a set of project-specific rules (in .mdc format suitable for Cursor) for a software project based on the following details.
These rules should guide an AI assistant (like Cursor) in implementing the project effectively.
Focus on rules directly relevant to the project description and chosen tech stack, complementing general best practices.

Project Description:
{projectDescription}

Problem Solved:
{problemStatement}

Target Users:
{targetUsers}

Key Features:
{features}

Tech Stack:
{techStackInfo}

Generate 3-5 concise, actionable rules specific to this project.
Example rule format:
- Ensure all API endpoints handling financial data validate input schemas rigorously using Zod.
- Implement React components using functional components and hooks, avoiding class components.
- Use Prisma ORM for all database interactions, adhering to defined schema models.

Output only the list of rules in markdown bullet point format, starting immediately with the first bullet point.
`;

export function getProjectRulesInput(inputs: ProjectInputData): ProjectBaseInput {
    return {
        projectDescription: inputs.projectDescription,
        problemStatement: inputs.problemStatement,
        features: inputs.features,
        targetUsers: inputs.targetUsers,
        techStackInfo: formatTechStack(inputs.techStack),
    };
}

// --- Specification Prompts ---

const baseSpecPrompt = `
Generate a {specFocus} in Markdown format for the software project described below.
The output should be a well-structured document suitable for developers and potentially AI assistants.

Project Description:
{projectDescription}

Problem Solved:
{problemStatement}

Target Users:
{targetUsers}

Key Features:
{features}

Tech Stack:
{techStackInfo}

--- BEGIN {specFocus} --- 
`;

const endSpecPrompt = `
--- END {specFocus} --- 

Ensure the generated {specFocus} is comprehensive for its type, well-organized with clear headings based on standard practices for this document type, and directly based on the provided project details.
Output only the Markdown content for the specification document, including the BEGIN/END markers.
`;

// Specific prompt details for PRD
const prdStructure = `
Structure the PRD with the following sections using Markdown headings:

## 1. Title and Overview
   - **Title:** [Infer a suitable title]
   - **Author(s):** CAPS Generator
   - **Date Created:** [Current Date]
   - **Date Updated:** [Current Date]
   - **Version:** 1.0

## 2. Objective / Purpose
   - [Succinct description of why the product/feature is being built, tied to goals. Example: 'This feature allows users to save articles...']

## 3. Background / Context
   - [Contextual info: business drivers, user feedback insights inferred from problem/features, etc.]

## 4. Goals and Success Metrics
   - **Business Goals:** [List 1-2 specific, measurable goals. Example: 'Increase article revisit rate by X%']
   - **User Goals:** [List 1-2 specific user outcomes. Example: 'Users can easily find saved articles']
   - **Success Metrics:** [List 1-2 key metrics. Example: 'Article revisit rate', 'Task completion time for finding saved items']

## 5. Personas / Target Users
   - [Describe the target users based on the input. Include a sample User Story or Job-to-be-Done (JTBD). Example: 'As a [Target User Type], I want to [Action related to feature], so I can [Benefit].']

## 6. Scope
   - **In Scope:** [List key features/aspects definitely included based on input]
   - **Out of Scope:** [List related items explicitly *not* included. Example: 'Mobile app support', 'Offline access']

## 7. Features & Requirements
   - [For each key feature derived from the 'Key Features' input, create a subsection like:]
   - ### Feature: [Feature Name]
     - **User Story / Acceptance Criteria:** [Combine user need with how to verify it's done. Example: 'As a user, I can click a Save button on an article, and it appears in my Reading List.']
     - **Functional Requirements:** [List specific actions/behaviors]
     - **Non-Functional Requirements:** [Mention relevant aspects like performance, security if applicable, otherwise state 'N/A']
     - **Priority:** Must-have (assume core features are must-have)

## 8. User Flows / UX Wireframes
   - [Describe the key user navigation paths in text. Example: '1. User views article. 2. User clicks Save button. 3. User navigates to Reading List page. 4. User sees saved article.']
   - *(Note: Actual wireframes are out of scope for AI generation)*

## 9. Technical Considerations
   - **Tech Stack:** [Summarize the provided or inferred tech stack]
   - **APIs / Integrations:** [Mention any implied third-party needs or internal APIs]
   - **Data / Database:** [Mention key data entities based on features]
   - **Security:** [Mention basic security points like authentication, input validation if relevant]
   - **Performance:** [Mention basic expectations like 'responsive UI' if relevant]
`;

// Other spec types can have simpler structures for now
const defaultSpecStructure = `
Structure the {specFocus} with logical sections relevant to its type (e.g., Test Cases for TPS, Component Breakdown for UI/UX, API Endpoints for Technical Spec, Schema Definition for Data Spec, etc.). Use clear Markdown headings.
`;

// Combine base, structure, and end prompts
export const specTemplate = `${baseSpecPrompt}
{specStructure}
${endSpecPrompt}`;

// Define input variables needed for spec generation
interface SpecInput extends ProjectBaseInput {
    specFocus: string;
    specStructure: string;
}

// Function to get the input object for spec generation
export function getSpecInput(specType: keyof ProjectInputData['generationOptions']['specs'], inputs: ProjectInputData): SpecInput {
    let specFocus = "";
    let specStructure = defaultSpecStructure;

    switch (specType) {
        case 'prd': specFocus = "Product Requirements Document (PRD)"; specStructure = prdStructure; break;
        case 'tps': specFocus = "Test Plan Specification (TPS)"; break;
        case 'uiUx': specFocus = "UI/UX Specification"; break;
        case 'technical': specFocus = "Technical Specification"; break;
        case 'data': specFocus = "Data Specification"; break;
        case 'integration': specFocus = "Integration Specification"; break;
    }

    // Replace placeholder in structure templates
    specStructure = specStructure.replace(/{specFocus}/g, specFocus);

    return {
        projectDescription: inputs.projectDescription,
        problemStatement: inputs.problemStatement,
        features: inputs.features,
        targetUsers: inputs.targetUsers,
        techStackInfo: formatTechStack(inputs.techStack),
        specFocus: specFocus,
        specStructure: specStructure,
    };
}

// --- Checklist Prompt --- 

export const checklistTemplate = `
Generate a detailed task checklist (in Markdown format with checkboxes) for implementing the software project described below.
The checklist should break down the project into concrete, actionable steps suitable for an AI assistant (like Cursor) or a developer to follow.
Cover setup, feature implementation, testing, and potentially deployment steps.

Project Description:
{projectDescription}

Problem Solved:
{problemStatement}

Target Users:
{targetUsers}

Key Features:
{features}

Tech Stack:
{techStackInfo}

Generate the checklist. Ensure tasks are logical, sequential where necessary, and cover the key aspects of the project based on the description and features.
Example task format:
- [ ] Set up Next.js project with TypeScript and Tailwind CSS.
- [ ] Implement user authentication using NextAuth.js.
- [ ] Create database schema for user profiles and posts.
- [ ] Build API endpoint for creating new posts.
- [ ] Develop frontend component for displaying posts.

Output only the Markdown checklist, starting immediately with the first task.
`;

// Function to get input for checklist (same as project rules)
export function getChecklistInput(inputs: ProjectInputData): ProjectBaseInput {
    return getProjectRulesInput(inputs); // Reuses the same input structure
} 