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
   - **Title:** [Infer a suitable title based on the project description]
   - **Author(s):** CAPS Generator
   - **Date Created:** [Current Date]
   - **Date Updated:** [Current Date]
   - **Version:** 1.0

## 2. Objective / Purpose
   - [Succinctly describe why the product/feature is being built, deriving the purpose from the user's problem statement and features. Tie it to potential user or business goals. Example format: "This feature allows users to {achieve something} which addresses {problem solved} by providing {key feature}, helping to increase {potential business goal like engagement or retention}."]

## 3. Background / Context
   - [Provide relevant context inferred from the user's input. Consider: What might have led to this project idea? Are there implied business drivers (e.g., solving a common user pain point)? Mention that this PRD is the starting point. Example: "User input indicates a need for {feature} to solve {problem}. Current solutions may be lacking. This document outlines the initial requirements."]

## 4. Goals and Success Metrics
   - [Define SMART goals based on the project objective.]
   - **Business Goals:** [List 1-2 specific, measurable business-oriented goals. Example: "Increase user engagement metric X by Y% within Z months after launch." or "Reduce support requests related to {problem} by X%."]
   - **User Goals:** [List 1-2 specific user-centric goals. Example: "{Target users} can successfully {achieve primary goal related to feature} with minimal friction." or "Reduce the time it takes for users to {perform key action}."]
   - **Success Metrics:** [List 1-2 key metrics to track goals. Examples: "Daily/Monthly Active Users", "Feature adoption rate", "Task success rate", "User satisfaction score (CSAT/NPS)".]

## 5. Personas / Target Users
   - [Describe the target users identified in the input.]
   - **Primary Persona(s):** [Brief description based on 'Target Users' input, including potential demographics, behaviors, and pain points derived from the 'Problem Solved' input.]
   - **User Story / JTBD:** [Create a sample user story or Job-To-Be-Done based on the inputs. Example: "As a {Target User Type}, I want to {perform action related to feature}, so that I can {achieve benefit related to solving the problem}."]

## 6. Scope
   - [Clearly define what is included and excluded.]
   - **✅ In Scope:** [List the core features mentioned in the user input as definitely included.]
   - **❌ Out of Scope:** [List common related items that are NOT included based on the input. Examples: "Mobile application version", "Offline functionality", "Administrator dashboard", "Advanced analytics beyond basic tracking".]

## 7. Features & Requirements
   - [Break down each key feature derived from the 'Key Features' input. Use the following format for each:]
   - ### Feature: [Feature Name]
     - **User Story:** [Restate the user need for this specific feature. Example: "As a {Target User}, I want to {action enabled by feature} so that {benefit}."]
     - **Acceptance Criteria:** [List specific, testable criteria. Example:
       - Given a user is viewing {relevant context},
       - When the user clicks the '{Feature Action Button}',
       - Then {observable outcome 1} should happen,
       - And {observable outcome 2} should happen.]
     - **Functional Requirements:** [List specific functions the system must perform for this feature.]
     - **Non-Functional Requirements:** [Mention relevant aspects like usability, performance targets, security considerations, accessibility (WCAG AA), etc., or state 'Standard performance and security apply.']
     - **Priority:** Must-have (Assume core features described by the user are must-haves for v1.0)

## 8. User Flows / UX Wireframes
   - [Describe the primary user flow(s) for achieving the main goal(s) using the features. Focus on the sequence of actions.]
   - **Example Flow (Saving an Item):**
     - 1. User navigates to the page containing {item}.
     - 2. User interacts with the 'Save {item}' button/icon.
     - 3. System provides visual feedback confirming the save action.
     - 4. User navigates to their personal '{Saved Items Area Name}'.
     - 5. User sees the saved {item} listed.
   - *(Note: Actual wireframes are out of scope for AI generation.)*

## 9. Technical Considerations
   - [Outline technical aspects based on user input or inferred best practices.]
   - **Tech Stack Summary:** [Summarize the tech stack provided in {techStackInfo}. If none provided, state 'To be determined, consider standard web technologies like React/Next.js, Node.js, PostgreSQL.']
   - **APIs / Integrations:** [Mention any potential third-party APIs needed (e.g., for payments, authentication) or if internal APIs will be built. If none apparent, state 'N/A initially.']
   - **Data / Database:** [Describe key data entities needed based on features (e.g., User, {Primary Item}). Mention potential database choice if provided in stack, otherwise suggest a common one.]
   - **Security Considerations:** [Mention standard points: Authentication/Authorization required, Input validation, Protection against common web vulnerabilities (XSS, CSRF).]
   - **Performance Needs:** [Mention general expectations: Responsive UI, Reasonable API response times under expected load.]
   - **Example Detail:** [If relevant, add specifics like: "Will leverage {specific library/service} for {purpose}. Data will be stored in {database type} with access restricted by user ID."]

## 10. Risks & Assumptions
   - [List potential risks or assumptions based on the project description.]
   - **Assumptions:** [Example: "Assumes users have modern web browsers.", "Assumes users are logged in for personalized features."]
   - **Risks:** [Example: "Risk of scope creep if {related feature} is added.", "Risk of user adoption if the UX for {key feature} is unclear."]

## 11. Dependencies
   - [List any known external or internal dependencies.]
   - **External:** [Example: "Availability of {Third-party API}", "Legal review of privacy policy."]
   - **Internal:** [Example: "Requires completion of the shared authentication service."]
   - [If no dependencies are apparent from the input, state 'None identified at this stage.']
`;

// --- NEW: Specific prompt details for Technical Specification ---
const technicalSpecStructure = `
Structure the Technical Specification with the following sections using Markdown headings:

## 1. Overview / Summary
   - [Provide a brief summary (1-2 paragraphs) of the system or feature being designed, referencing the main goals from the project description or PRD.]
   - Example: "This specification outlines the backend services, APIs, and database schema required to implement the {feature name} feature..."

## 2. System Architecture
   - [Describe the high-level architecture. Explain how the main components (frontend, backend services, databases, external APIs) interact for this feature/system. A simple text description is sufficient; Mermaid diagrams can be added later if needed.]
   - Example: "The React frontend will call a new Node.js backend API endpoint. This endpoint will interact with the PostgreSQL database to retrieve/update user data. User authentication is handled by a separate existing Auth service."

## 3. Tech Stack
   - [List the specific technologies used or changed for this project/feature, based on {techStackInfo}. If not specified, suggest a standard stack.]
   - **Frontend:** [e.g., React, Next.js, Zustand, Tailwind CSS]
   - **Backend:** [e.g., Node.js, Express, NestJS]
   - **Database:** [e.g., PostgreSQL, Redis (for caching)]
   - **Infrastructure:** [e.g., Docker, Vercel, AWS S3]
   - **Other:** [e.g., Stripe API, Sentry (for logging)]

## 4. API Design (if applicable)
   - [Define any new or significantly modified API endpoints required for the features. Use a clear format for each.]
   - ### POST /api/{resource-name}
     - **Description:** [What the endpoint does, e.g., Creates a new {resource}]
     - **Authentication:** [Required (e.g., JWT Bearer Token) / None]
     - **Request Body:** [Describe JSON payload structure, e.g., { "field": "string", "count": "number" }]
     - **Validation:** [Mention key validation rules, e.g., "field is required, count must be > 0"]
     - **Response (Success - e.g., 201 Created):** [Describe success response body, e.g., { "id": "string", "message": "Created successfully" }]
     - **Response (Error - e.g., 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error):** [Describe potential error responses.]
   - [Repeat for other endpoints (GET, PUT, DELETE etc.) as needed.]
   - [If no new APIs, state "No new API endpoints required; existing APIs will be used."]

## 5. Data Model / Schema Changes
   - [Detail new or modified database tables, fields, relationships, or indexes based on the features and data requirements.]
   - **New Table: `{table_name}`**
     - `id`: [Type, e.g., UUID PRIMARY KEY]
     - `user_id`: [Type, e.g., UUID, REFERENCES users(id)]
     - `{field_name}`: [Type, e.g., VARCHAR(255), TIMESTAMP, BOOLEAN DEFAULT false]
     - `created_at`: [Type, e.g., TIMESTAMP DEFAULT NOW()]
   - **Modified Table: `{existing_table}`**
     - **Add column:** `{new_column}` [Type, Constraints]
     - **Modify column:** `{column_name}` [New type or constraints]
   - **Indexes:** [Mention any new indexes needed, e.g., "Add index on `user_id` in `{table_name}`"]
   - [If no DB changes, state "No database schema changes required."]

## 6. Business Logic & Workflow
   - [Describe the core logic for the main features/operations. Pseudocode or step-by-step descriptions are helpful.]
   - **Example (Saving an Item):**
     - 1. Receive request data (userId, itemId) at API endpoint.
     - 2. Validate input (non-empty IDs, check user auth).
     - 3. Query database: Check if item already saved by this user.
     - 4. IF exists, return {conflict/already saved error}.
     - 5. ELSE Insert new record into `saved_items` table (userId, itemId).
     - 6. IF insert successful, return {success message}.
     - 7. ELSE return {database error}.

## 7. Frontend Integration Points
   - [Describe how the frontend interacts with the backend for this feature.]
   - **API Calls:** [Which new/existing API endpoints will the frontend call?]
   - **State Management:** [How will related frontend state be managed (e.g., using Zustand store, component state)?]
   - **Authentication:** [How will frontend pass credentials/tokens?]
   - **Error Handling:** [How should frontend display API errors?]
   - **Loading States:** [How should loading states be handled during API calls?]

## 8. Security & Compliance Requirements
   - [Address key security aspects.]
   - **Authentication/Authorization:** [Confirm if endpoints require login. Mention specific roles if applicable.]
   - **Input Validation:** [Reiterate that backend validates all input from client/API.]
   - **Data Encryption:** [Specify if encryption needed (e.g., "Standard TLS for data in transit. Sensitive fields encrypted at rest if applicable.")]
   - **PII Handling:** [Address if Personally Identifiable Information is handled and how (e.g., "Minimize storage, apply masking/encryption as needed.")]
   - **Dependencies:** [Mention reliance on specific auth libraries/services.]

## 9. Performance & Scalability Considerations
   - [Outline performance goals and strategies.]
   - **Expected Load:** [Briefly estimate usage (e.g., Low, Medium, High traffic expected initially).]
   - **Caching:** [Identify opportunities for caching (e.g., "Cache user profile data in Redis for 1 hour.")]
   - **Database:** [Mention indexing strategies (covered in Data Model) or potential need for read replicas if high load expected.]
   - **Asynchronous Operations:** [Identify if any tasks should be handled async (e.g., sending emails, complex background processing).]

## 10. Analytics & Logging
   - [Define what needs to be tracked.]
   - **Logging:** [Specify key events/errors to log (e.g., "Log API request/response summaries, log critical errors with stack traces"). Mention target (e.g., Console, Datadog).]
   - **Monitoring:** [What key metrics should be monitored? (e.g., "API latency, error rates (4xx, 5xx), database connection pool usage").]
   - **Alerting:** [On what conditions should alerts be triggered? (e.g., "Alert on sustained high error rate > 5%").]

## 11. Testing Plan
   - [Outline the testing approach.]
   - **Unit Tests:** [Cover critical business logic, helper functions, API validation.]
   - **Integration Tests:** [Test interaction between API, service layer, and database.]
   - **API Contract Tests:** [Verify API request/response structure.]
   - **End-to-End (E2E) Tests:** [Optional, cover key user flows if feasible.]
   - **Load Tests:** [Mention if planned for performance-critical endpoints.]

## 12. Deployment Plan
   - [Describe how the feature/system will be released.]
   - **Environments:** [Confirm deployment through dev/staging/prod.]
   - **CI/CD:** [Assume standard CI/CD pipeline handles build/test/deploy.]
   - **Rollout Strategy:** [Default: Standard deployment. Mention feature flags, canary, or blue-green if planned.]
   - **Rollback:** [Confirm rollback procedure exists (e.g., "Revert commit and redeploy previous version via CI/CD").]

## 13. Migration Plan (if applicable)
   - [Detail steps if existing data needs migration.]
   - **Scripts:** [Describe necessary data migration scripts.]
   - **Process:** [Outline deployment steps for migration (e.g., "Run script before deploying new code").]
   - **Validation:** [How to verify migration success?]
   - **Rollback:** [How to roll back migration if needed?]
   - [If not applicable, state "No data migration required."]

## 14. Dependencies
   - [List external or internal dependencies.]
   - **External:** [e.g., "{Third-party Service} API must be available."]
   - **Internal:** [e.g., "Requires deployment of updated {Shared Library}", "Depends on {Team Name} completing {Related Task}".]
   - [If none apparent, state "None identified at this stage."]
`;

// Define example structures for other specs to avoid complex inline strings
const tpsExampleStructure = `
Examples sections for TPS:
- Test Objectives
- Scope (In/Out)
- Test Strategy (Manual/Automated)
- Test Cases (ID, Description, Steps, Expected Result)
- Test Data Requirements
- Environment Requirements
- Success/Exit Criteria
`;

const uiUxExampleStructure = `
Example sections for UI/UX Spec:
- Design Goals & Principles
- Key User Flows (Visual - Placeholder)
- Wireframes/Mockups (Links or Descriptions)
- Component Library Usage (e.g., Material UI, Shadcn/ui)
- Accessibility Notes (e.g., WCAG Compliance Level)
- Interaction Details (e.g., Animations, Loading States)
`;

const dataExampleStructure = `
Example sections for Data Spec:
- Data Sources
- Detailed Schema Definitions (Tables, Columns, Types, Constraints)
- Relationships (ERD Description/Placeholder)
- Data Flow Diagram (Description)
- Data Validation Rules (Beyond basic types)
- Data Retention / Deletion Policy
- PII / Sensitive Data Handling
`;

const integrationExampleStructure = `
Example sections for Integration Spec:
- System Overview (Involved systems)
- Integrated Systems Details
- Data Exchange Format (e.g., JSON, XML)
- API Endpoint Details (Consumed/Exposed)
- Authentication/Authorization Methods
- Sequence Diagram (Description/Placeholder)
- Error Handling Strategy
- Monitoring & Logging Requirements
`;

// Updated defaultSpecStructure using the examples above
const defaultSpecStructure = `
Structure the {specFocus} with logical sections relevant to its type. Use clear Markdown headings.

**Examples based on Spec Type:**

*If {specFocus} is Test Plan Specification (TPS):*
${tpsExampleStructure}

*If {specFocus} is UI/UX Specification:*
${uiUxExampleStructure}

*If {specFocus} is Data Specification:*
${dataExampleStructure}

*If {specFocus} is Integration Specification:*
${integrationExampleStructure}
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
    let specStructure = defaultSpecStructure; // Start with default including examples

    switch (specType) {
        case 'prd': 
            specFocus = "Product Requirements Document (PRD)"; 
            specStructure = prdStructure; 
            break;
        case 'tps': 
            specFocus = "Test Plan Specification (TPS)"; 
            // Default structure already includes TPS examples
            break;
        case 'uiUx': 
            specFocus = "UI/UX Specification"; 
            // Default structure already includes UI/UX examples
            break;
        case 'technical': 
            specFocus = "Technical Specification"; 
            specStructure = technicalSpecStructure; 
            break;
        case 'data': 
            specFocus = "Data Specification"; 
            // Default structure already includes Data examples
            break;
        case 'integration': 
            specFocus = "Integration Specification"; 
            // Default structure already includes Integration examples
            break;
    }

    // Replace placeholder in the chosen structure template
    // This needs to happen *after* selecting PRD/Technical or keeping default
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