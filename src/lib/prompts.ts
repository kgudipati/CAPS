import { ProjectInputData, TechStack } from "@/types"; // Use correct ProjectInputData type

// Define the actual shape of the tech stack data coming from the Zod schema
type InputTechStack = Partial<{ [K in keyof TechStack]: string[] | undefined }>;

// Helper function to format tech stack details
export function formatTechStack(techStack: InputTechStack): string {
    let stackDetails = "";
    // Helper to format each part of the stack
    const formatPart = (label: string, items: string[] | undefined) => {
        if (items && items.length > 0) {
            return `${label}: ${items.join(', ')}\n`;
        }
        return "";
    };

    stackDetails += formatPart("Frontend", techStack.frontend);
    stackDetails += formatPart("Backend", techStack.backend);
    stackDetails += formatPart("Database", techStack.database);
    stackDetails += formatPart("Infrastructure/Hosting", techStack.infrastructure);
    stackDetails += formatPart("Other Tools/Libraries", techStack.other);

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

export function getProjectRulesInput(inputs: ProjectInputData, techStackInfo: string): ProjectBaseInput {
    return {
        projectDescription: inputs.projectDescription,
        problemStatement: inputs.problemStatement,
        features: inputs.features,
        targetUsers: inputs.targetUsers,
        techStackInfo: techStackInfo,
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
   - **New Table: \`{table_name}\`**
     - \`id\`: [Type, e.g., UUID PRIMARY KEY]
     - \`user_id\`: [Type, e.g., UUID, REFERENCES users(id)]
     - \`{field_name}\`: [Type, e.g., VARCHAR(255), TIMESTAMP, BOOLEAN DEFAULT false]
     - \`created_at\`: [Type, e.g., TIMESTAMP DEFAULT NOW()]
   - **Modified Table: \`{existing_table}\`**
     - **Add column:** \`{new_column}\` [Type, Constraints]
     - **Modify column:** \`{column_name}\` [New type or constraints]
   - **Indexes:** [Mention any new indexes needed, e.g., "Add index on \`user_id\` in \`{table_name}\`"]
   - [If no DB changes, state "No database schema changes required."]

## 6. Business Logic & Workflow
   - [Describe the core logic for the main features/operations. Pseudocode or step-by-step descriptions are helpful.]
   - **Example (Saving an Item):**
     - 1. Receive request data (userId, itemId) at API endpoint.
     - 2. Validate input (non-empty IDs, check user auth).
     - 3. Query database: Check if item already saved by this user.
     - 4. IF exists, return {conflict/already saved error}.
     - 5. ELSE Insert new record into \`saved_items\` table (userId, itemId).
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

// --- Updated: Specific prompt details for UI/UX Specification ---
const uiUxSpecStructure = `
Structure the UI/UX Specification with the following sections using Markdown headings:

## 1. Screens / Pages List
   - [List all primary screens/pages involved in the features described.]
   - **Table Format:**
     | Screen/Page Name | Path/Route         | Brief Description                             |
     |------------------|--------------------|-----------------------------------------------|
     | {Example Home}   | /                  | Main landing page                             |
     | {Example Feature}| /{feature-route}   | Page for {primary feature interaction}      |
     | {Example List}   | /{list-route}      | Page displaying {list of items}           |
     | Login            | /login             | User authentication page (if required)        |

## 2. Wireframes or High-Fidelity Designs (Conceptual)
   - *(Note: AI cannot generate actual images. Describe the key visual elements, layout, and states conceptually for each main screen listed above.)*
   - **Screen: {Screen Name from Section 1}**
     - **Key Elements:** [List main UI elements and their rough placement, e.g., Header (Logo, Nav), Main Content Area (Form, Data Table), Footer.]
     - **States:**
       - *Loading:* [Describe indicator, e.g., "Skeleton loaders for table rows", "Spinner overlay on form area".]
       - *Error:* [Describe error display, e.g., "Inline error messages below form fields", "Global error banner at top: 'Failed to {action}'."]
       - *Empty:* [Describe state when no data exists, e.g., "Message in table area: 'No {items} found. Get started by {action}'."]
       - *Success/Default:* [Describe the normal, populated state.]
   - [Repeat for other key screens.]

## 3. Component Breakdown (Conceptual)
   - [Describe key reusable UI components conceptually. Focus on purpose, data needs (props), and core behavior.]
   - **Component: {ExampleButton} (e.g., Primary Action Button)**
     - **Purpose:** [e.g., To submit the main form, to save an item.]
     - **Key Props (Conceptual):** [e.g., \`isDisabled: boolean\`, \`isLoading: boolean\`, \`onClick: function\`, \`text: string\`]
     - **Behavior:** [e.g., "Displays \`text\`. Visual style changes based on \`isDisabled\` and \`isLoading\`. Triggers \`onClick\` when pressed."]
   - **Component: {ExampleInput} (e.g., Text Input with Label)**
     - **Purpose:** [e.g., Capture user text input for {field}.]
     - **Key Props (Conceptual):** [e.g., \`label: string\`, \`value: string\`, \`onChange: function\`, \`errorText: string | null\`]
     - **Behavior:** [e.g., "Displays \`label\`. Updates \`value\` via \`onChange\`. Shows \`errorText\` if present."]
   - [Describe other key components like Modals, Tables, Cards, etc.]

## 4. State Handling (Conceptual Frontend State)
   - [Describe how key frontend state is likely managed.]
   - **Global State:** [Identify data/state needed across multiple components (e.g., User Info, Auth Status, App Settings). Suggest storing in global state (Zustand recommended based on project stack).]
   - **Local Component State:** [Identify state confined to single components (e.g., Form input values, Dropdown open/close status, Modal visibility).]
   - **Server Cache/Data Fetching State:** [Mention approach (e.g., React Query, SWR, or basic fetch) for managing API data, loading, and error states related to data fetching.]

## 5. User Interactions & Transitions
   - [Describe the expected behavior for key interactions.]
   - **Interaction:** [Example: Clicking Save Button]
     - *Trigger:* User clicks 'Save'.
     - *Action:* Button enters loading state. API call initiated.
     - *Feedback (Success):* Show success toast ("Item Saved!"). Button state resets, potentially shows 'Saved' state briefly.
     - *Feedback (Error):* Show error toast ("Failed to save"). Button state resets.
   - **Transition:** [Example: Navigating to Detail Page]
     - *Trigger:* User clicks item in list.
     - *Action:* Navigate to /{item-route}/{item-id}.
     - *Feedback:* Show page transition (if any). Display loading state on detail page while data fetches.

## 6. Navigation Flows
   - [Describe how users move between the key screens listed in Section 1 to accomplish primary tasks.]
   - **Flow Example (Achieving {Primary Goal}):**
     - 1. User starts at {Start Screen}.
     - 2. User clicks {Link/Button} to navigate to {Screen A}.
     - 3. User interacts with {Component} on Screen A.
     - 4. User is redirected/navigates to {Screen B}.
     - 5. User sees {Result} on Screen B.

## 7. Responsive Design
   - [Outline the approach to different screen sizes.]
   - **Breakpoints:** [Specify standard breakpoints if known (e.g., sm, md, lg based on Tailwind defaults) or state "Standard mobile, tablet, desktop breakpoints apply."]
   - **Behavior:** [Describe general adaptation strategy (e.g., "Stack elements vertically on mobile", "Use drawer navigation on smaller screens", "Ensure tables are scrollable horizontally on mobile").]

## 8. Accessibility (a11y)
   - [Outline accessibility commitments.]
   - **Standard:** Target WCAG 2.1 Level AA compliance.
   - **Keyboard Navigation:** All interactive elements (buttons, links, inputs, etc.) must be focusable and operable via keyboard.
   - **Screen Reader Support:** Use semantic HTML. Provide meaningful alt text for images. Use ARIA attributes (e.g., \`aria-label\`, \`aria-required\`) where necessary to enhance screen reader experience.
   - **Color Contrast:** Ensure text and UI elements meet minimum contrast ratios.

## 9. Design Tokens & Theming (Conceptual)
   - [Describe the visual design system foundation.]
   - **Fonts:** [Specify primary font families if known, otherwise state "Standard sans-serif font (e.g., Inter)."]
   - **Colors:** [Mention primary brand colors if known, otherwise state "Standard color palette with primary, secondary, success, error colors."]
   - **Spacing:** [Mention if a spacing scale (e.g., 4px or 8px grid) is used.]
   - **Theming:** [Mention if dark mode support is required/planned.]

## 10. Frontend-Backend Contracts (Data Expectations)
   - [Summarize the data the UI expects from the backend APIs defined in the Technical Spec.]
   - **Data for {Feature} Page:** [Expected fields/structure, e.g., \`user: { id, name }\`, \`items: [ { id, title, status } ]\`]
   - **Data for {List} Page:** [Expected fields/structure]

## 11. UX Edge Cases
   - [Identify potential edge cases and how the UI should handle them.]
   - **Invalid Input:** [How are validation errors displayed (e.g., "Inline messages below fields upon losing focus or submission attempt").]
   - **Network Errors:** [How are general API connection failures handled (e.g., "Global error message/toast").]
   - **Rate Limiting:** [If applicable, how is user notified (e.g., "Toast message: 'Too many requests, please try again later'.").]

## 12. Testing Plan (Frontend Focus)
   - [Outline expected frontend testing.]
   - **Component Tests:** [Test individual components in isolation using tools like Vitest/Jest and React Testing Library.]
   - **Integration Tests:** [Test interaction between multiple components, context/store integration.]
   - **E2E Tests:** [Optional: Use tools like Cypress or Playwright to test critical user flows in a browser.]
   - **Visual Regression Tests:** [Optional: Mention if visual testing tools will be used.]

## 13. Component Library Reference
   - [Specify the UI component library being used, if decided.]
   - **Library:** [e.g., Shadcn/ui, Material UI, Ant Design, Custom internal library.]
   - **Storybook:** [Mention if Storybook will be used for component development and documentation.]
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

// --- NEW: Specific prompt details for Data Specification ---
const dataSpecStructure = `
Structure the Database & Storage Specification with the following sections using Markdown headings:\\n
## 1. Data Models / Schema
   - [Define tables, collections, or data structures. Include primary keys, data types, and brief descriptions.]
   - Example Table:
     \`\`\`sql
     CREATE TABLE users (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         email VARCHAR(255) UNIQUE NOT NULL,
         hashed_password TEXT NOT NULL,
         created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
     );
     \`\`\`
   - Example Document (NoSQL):
     \`\`\`json
     {
       "_id": "ObjectId(...)",
       "userId": "UUID",
       "preferences": { "theme": "dark" },
       "lastLogin": "ISODate(...)"
     }
     \`\`\`
\\n## 2. Data Types & Constraints
   - [Detail specific data types, formats (e.g., ISO 8601 for dates), constraints (NOT NULL, UNIQUE, CHECK), and default values.]
   - Example: \`email\` must be a valid email format and is unique. \`created_at\` defaults to the current UTC timestamp.
\\n## 3. Relationships
   - [Describe relationships between data entities (one-to-one, one-to-many, many-to-many). Specify foreign keys and join strategies if applicable.]
   - Example: \`orders\` table has a \`user_id\` foreign key referencing \`users(id)\` (one-to-many: one user can have many orders).
\\n## 4. Indexes & Optimization
   - [List planned indexes beyond primary/foreign keys. Explain the rationale (e.g., speeding up common queries).]
   - Example: Add index on \`email\` in \`users\` table for faster login lookups. Add composite index on \`(product_id, date)\` in \`sales\` table for reporting queries.
\\n## 5. Data Retention & Archiving
   - [Specify policies for how long data is kept and how/if it's archived or deleted.]
   - Example: User activity logs older than 1 year will be archived to cold storage. Inactive user accounts will be anonymized or deleted after 2 years.
\\n## 6. Storage Infrastructure
   - [Describe the underlying storage technology (e.g., PostgreSQL on AWS RDS, MongoDB Atlas, AWS S3).]
   - Example: Primary database is PostgreSQL 15 managed via AWS RDS. User uploads are stored in AWS S3 in the \`us-east-1\` region.
\\n## 7. Backups & Restore
   - [Outline the backup strategy (frequency, retention) and the process for restoring data.]
   - Example: Daily automated snapshots of the RDS instance, retained for 14 days. Point-in-time recovery enabled. S3 objects have versioning enabled.
\\n## 8. Migration Strategy (if applicable)
   - [Describe the plan for migrating existing data or schema changes. Include steps for data transformation and validation.]
   - Example: Use Flyway/Liquibase for schema migrations. A one-time script will be run to populate the new \`preferences\` field based on existing settings. Downtime expected: ~5 minutes during deployment.
\\n## 9. Security
   - [Detail data security measures: encryption (at rest, in transit), access control mechanisms (roles, permissions), auditing.]
   - Example: Data encrypted at rest using AWS KMS. TLS 1.2+ enforced for data in transit. Access to production database restricted to specific IAM roles. Sensitive PII fields (if any) are encrypted application-side.
\\n## 10. Access Patterns
   - [Describe the primary ways data will be read and written. Consider query frequency, data volume, and performance requirements.]
   - Example: High read frequency for product catalog. Moderate write frequency for user orders. Low frequency for administrative reports. Optimize queries for user profile loading.
\\n## 11. File/Object Storage Layout (if applicable)
   - [If using object storage (like S3), describe the bucket structure and naming conventions.]
   - Example: S3 Bucket: \`my-app-uploads-prod\`. Structure: \`uploads/{user_id}/{yyyy}/{mm}/{dd}/{file_uuid}.{ext}\`.\n
## 12. Compliance / PII Handling
   - [Identify any specific compliance requirements (GDPR, HIPAA, etc.) and how Personally Identifiable Information (PII) is handled.]
   - Example: System designed with GDPR principles. PII identified: email, name. Minimize PII collection and provide user mechanisms for data access/deletion requests. No HIPAA data involved.
`;

// --- Corrected: Specific prompt details for Integration Specification ---
const integrationSpecStructure = `
Structure the Third-Party Integration Specification with the following sections using Markdown headings:\\n
## 1. Integration Overview
   - [Provide a brief overview of the third-party service being integrated and the purpose of the integration.]
   - Example: Integrate with Stripe for payment processing. Allows users to purchase subscriptions.\n
## 2. Use Case(s)
   - [Describe the specific scenarios where this integration is used.]
   - Example: 1. User initiates checkout. 2. User enters payment details via Stripe Elements. 3. Backend confirms payment with Stripe and activates subscription. 4. Handle webhook events from Stripe (e.g., payment succeeded, subscription cancelled).\n
## 3. Authentication Method
   - [Specify how your application authenticates with the third-party service.]
   - Example: Using Stripe API Secret Key (restricted permissions) stored securely in environment variables. Authenticate webhook requests using Stripe's signature verification.\n
## 4. Endpoints / SDK Methods Used
   - [List the specific API endpoints or SDK functions that will be called.]
   - Example:\n
     - Stripe SDK (Node.js): \`stripe.paymentIntents.create(...)\`, \`stripe.customers.create(...)\`, \`stripe.subscriptions.create(...)\`\n
     - Webhook Handler Endpoint: \`POST /api/webhooks/stripe\`\n
## 5. Rate Limits & Quotas
   - [Note the relevant rate limits or quotas imposed by the third-party service.]
   - Example: Stripe's standard rate limits apply (e.g., 100 read/write operations per second in live mode). Monitor usage via Stripe dashboard.\n
## 6. Failure Modes & Retry Strategy
   - [Identify potential failure points (API errors, network issues, webhook delays) and outline the retry logic or fallback mechanisms.]
   - Example: Use idempotent requests for creating Stripe objects. Implement exponential backoff for retrying failed API calls (up to 3 times). Log errors to Sentry. Have a manual process for reconciling failed payments if automated retries fail. Queue webhook processing to handle potential delays or failures.\n
## 7. Data Mapping
   - [Describe how data fields map between your system and the third-party service.]
   - Example:\n
     | Your System Field | Stripe Object/Field           | Direction    | Notes                               |\n
     |-------------------|-------------------------------|--------------|-------------------------------------|\n
     | \`user.id\`         | \`Customer.metadata.userId\`  | Outbound     | Link Stripe Customer to local user  |\n
     | \`order.total\`     | \`PaymentIntent.amount\`      | Outbound     | Amount in cents                     |\n
     | \`Subscription.id\` | \`Subscription.id\`           | Inbound/Sync | Store Stripe subscription ID        |\n
     | \`user.email\`      | \`Customer.email\`            | Outbound     |                                     |\n
## 8. Security Considerations
   - [Highlight security measures related to the integration.]
   - Example: Never log raw API keys. Store keys securely (e.g., AWS Secrets Manager). Validate all webhook data using signatures. Restrict API key permissions to the minimum required. Sanitize any data received from the third party before storing or displaying.
`;

// Updated defaultSpecStructure using the examples above
const defaultSpecStructure = `
Structure the {specFocus} with logical sections relevant to its type. Use clear Markdown headings.\\n
**Examples based on Spec Type:**\\n
*If {specFocus} is Product Requirements Document (PRD):*\\n${prdStructure}\\n
*If {specFocus} is Technical Specification:*\\n${technicalSpecStructure}\\n
*If {specFocus} is UI/UX Specification:*\\n${uiUxSpecStructure}\\n
*If {specFocus} is Test Plan Specification (TPS):*\\n${tpsExampleStructure}\\n
*If {specFocus} is Data Specification:*\\n${dataSpecStructure}\\n
*If {specFocus} is Integration Specification:*\\n${integrationSpecStructure}
`;

// Combine base, structure, and end prompts - CORRECTED TEMPLATE LITERAL
export const specTemplate = `${baseSpecPrompt}\\n{specStructure}\\n${endSpecPrompt}`;

// Define input variables needed for spec generation
interface SpecInput extends ProjectBaseInput {
    specFocus: string;
    specStructure: string;
}

// Function to get the input object for spec generation
export function getSpecInput(specType: keyof ProjectInputData['generationOptions']['specs'], inputs: ProjectInputData, techStackInfo: string): SpecInput {
    let specFocus = "";
    let specStructure = defaultSpecStructure; // Start with default

    switch (specType) {
        case 'prd':
            specFocus = "Product Requirements Document (PRD)";
            specStructure = prdStructure;
            break;
        case 'tps':
            specFocus = "Test Plan Specification (TPS)";
            // Use default structure template, {specFocus} will be replaced below
            // specStructure = defaultSpecStructure; // No explicit structure needed, keep default
            break;
        case 'uiUx':
            specFocus = "UI/UX Specification";
            specStructure = uiUxSpecStructure;
            break;
        case 'technical':
            specFocus = "Technical Specification";
            specStructure = technicalSpecStructure;
            break;
        case 'data':
            specFocus = "Database & Storage Specification"; // Corrected focus name
            specStructure = dataSpecStructure;
            break;
        case 'integration': // Ensure this case exists and assigns the structure
            specFocus = "Third-Party Integration Specification";
            specStructure = integrationSpecStructure;
            break;
        // Add cases for other spec types if needed
    }

    // Replace placeholder in the chosen or default structure template
    specStructure = specStructure.replace(/{specFocus}/g, specFocus);

    return {
        projectDescription: inputs.projectDescription,
        problemStatement: inputs.problemStatement,
        features: inputs.features,
        targetUsers: inputs.targetUsers,
        techStackInfo: techStackInfo,
        specFocus: specFocus, // Pass the determined focus
        specStructure: specStructure, // Pass the processed structure string
    };
}

// --- Checklist Prompt ---

export const checklistTemplate = `
You are a senior AI software engineer tasked with generating a **highly detailed and comprehensive Test-Driven Development (TDD) implementation checklist** in Markdown format with checkboxes ([ ]). The checklist must strictly follow TDD methodology.

**Your Output Must:**
- Use Markdown formatting
- Use nested headings and task groups (##, ###, ####)
- Structure the checklist into logical, testable, dependency-aware blocks

**Scope & Focus:**
- Focus exclusively on the **coding and testing phase** of the project.
- DO NOT include tasks for:
  - Documentation writing
  - User research
  - CI/CD setup
  - Deployment
  - Infrastructure provisioning
  - Project planning or meetings

This checklist should serve as an **execution plan for a developer or AI coding agent** working end-to-end to implement the system described.

---

## CORE PRINCIPLES FOR CHECKLIST GENERATION:

### 1. DECOMPOSE THE SYSTEM
Break the project into logical implementation areas based on user-provided context:
- Data Models / DB Schema
- Core Backend Logic & Services
- API Routes & Validation
- Utility Functions
- State Management (if applicable)
- UI Components (if applicable)
- Frontend-Backend Integration (if applicable)
- CLI Tools / Scripts / Libraries (if applicable)

This project could be:
- A backend-only API
- A CLI tool
- A full-stack app
- A framework or SDK
Generate the checklist accordingly.

---

### 2. FOLLOW STRICT TDD WORKFLOW FOR EACH UNIT:

For **every implementable unit**, follow this sequence:
1. **TEST** — Write a failing test for the smallest unit of functionality
2. **IMPL** — Write only the code needed to pass the test
3. **REFACTOR** — (Optional) Refactor the test or code once it passes
4. **Repeat** — For edge cases, validation, errors, etc.

Each item should look like:
- [ ] TEST: {Component/Service} - Write failing test for {specific case}
- [ ] IMPL: {Component/Service} - Implement logic to pass test
- [ ] REFACTOR: {Component/Service} - Improve logic, naming, or error handling

---

### 3. USE HIERARCHICAL STRUCTURE:

Organize checklist using Markdown headers. Example:

## Backend
### Database Models
#### User Model
- [ ] TEST: User model - unique email constraint
- [ ] IMPL: Create schema and enforce constraint
- [ ] TEST: User model - password hashing behavior
- [ ] IMPL: Implement before-save hook

### Services
#### Auth Service
- [ ] TEST: loginUser - failing test for wrong password
- [ ] IMPL: Implement password validation

---

### 4. EXPLICITLY HANDLE:
- Input validation
- Error cases
- Security (auth checks, sensitive data handling)
- Edge cases (e.g., rate limits, concurrency, null inputs)

---

### 5. DESCRIPTIVE & IMPLEMENTABLE TASKS

Avoid vague tasks like:
- [ ] Build authentication

Instead use:
- [ ] TEST: Auth Service - loginUser - invalid credentials
- [ ] IMPL: loginUser - check credentials, return 401
- [ ] TEST: Auth API - POST /api/auth/login - missing fields
- [ ] IMPL: Auth API - validate request payload

---

**Project Details:**

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

---

--- BEGIN CHECKLIST ---

Generate a comprehensive, dependency-aware, TDD-style coding checklist based strictly on the above principles and project details. Use markdown formatting. Structure by major categories (e.g., Backend, Frontend, Services, etc.) and sub-categories (e.g., Models, API Routes, Utilities, UI Components). Include detailed test → implement → refactor steps for each.

--- END CHECKLIST ---
`;

// Updated function signature (reusing getProjectRulesInput structure)
export function getChecklistInput(inputs: ProjectInputData, techStackInfo: string): ProjectBaseInput {
    // Reuses the same input structure, just pass techStackInfo through
    return getProjectRulesInput(inputs, techStackInfo);
} 