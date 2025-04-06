import { ProjectInputState, TechStack } from '@/types';

// Helper function to format tech stack details
function formatTechStack(techStack: TechStack): string {
    let stackDetails = "";
    if (techStack.frontend) stackDetails += `Frontend: ${techStack.frontend}\n`;
    if (techStack.backend) stackDetails += `Backend: ${techStack.backend}\n`;
    if (techStack.database) stackDetails += `Database: ${techStack.database}\n`;
    if (techStack.infrastructure) stackDetails += `Infrastructure/Hosting: ${techStack.infrastructure}\n`;
    if (techStack.other) stackDetails += `Other Tools/Libraries: ${techStack.other}\n`;
    return stackDetails.trim() ? `The user specified the following tech stack:\n${stackDetails.trim()}` : "The user did not specify a tech stack; suggest one if appropriate based on the project.";
}

// --- Prompt Generation Functions --- 

export function constructProjectRulesPrompt(inputs: Omit<ProjectInputState, 'isLoading' | 'error' | 'apiKey'>): string {
    const techStackInfo = formatTechStack(inputs.techStack);
    return `
Generate a set of project-specific rules (in .mdc format suitable for Cursor) for a software project based on the following details.
These rules should guide an AI assistant (like Cursor) in implementing the project effectively.
Focus on rules directly relevant to the project description and chosen tech stack, complementing general best practices.

Project Description:
${inputs.projectDescription}

Problem Solved:
${inputs.problemStatement}

Target Users:
${inputs.targetUsers}

Key Features:
${inputs.features}

${techStackInfo}

Generate 3-5 concise, actionable rules specific to this project.
Example rule format:
- Ensure all API endpoints handling financial data validate input schemas rigorously using Zod.
- Implement React components using functional components and hooks, avoiding class components.
- Use Prisma ORM for all database interactions, adhering to defined schema models.

Output only the list of rules in markdown bullet point format.
`;
}

export function constructSpecPrompt(specType: keyof ProjectInputState['generationOptions']['specs'], inputs: Omit<ProjectInputState, 'isLoading' | 'error' | 'apiKey'>): string {
    const techStackInfo = formatTechStack(inputs.techStack);
    let specFocus = "";

    switch (specType) {
        case 'prd': specFocus = "Product Requirements Document (PRD)"; break;
        case 'tps': specFocus = "Test Plan Specification (TPS)"; break;
        case 'uiUx': specFocus = "UI/UX Specification"; break;
        case 'technical': specFocus = "Technical Specification (including architecture, data models, API endpoints if applicable)"; break;
        case 'data': specFocus = "Data Specification (database schema, data flow, data management)"; break;
        case 'integration': specFocus = "Integration Specification (third-party services, APIs)"; break;
        default: return ""; // Should not happen
    }

    return `
Generate a ${specFocus} in Markdown format for the software project described below.
The output should be a well-structured document suitable for developers and potentially AI assistants.

Project Description:
${inputs.projectDescription}

Problem Solved:
${inputs.problemStatement}

Target Users:
${inputs.targetUsers}

Key Features:
${inputs.features}

${techStackInfo}

Generate the ${specFocus}. Ensure it is comprehensive for its type, well-organized with clear headings, and directly based on the provided project details.
Output only the Markdown content for the specification document.
`;
}

export function constructChecklistPrompt(inputs: Omit<ProjectInputState, 'isLoading' | 'error' | 'apiKey'>): string {
    const techStackInfo = formatTechStack(inputs.techStack);
    return `
Generate a detailed task checklist (in Markdown format with checkboxes) for implementing the software project described below.
The checklist should break down the project into concrete, actionable steps suitable for an AI assistant (like Cursor) or a developer to follow.
Cover setup, feature implementation, testing, and potentially deployment steps.

Project Description:
${inputs.projectDescription}

Problem Solved:
${inputs.problemStatement}

Target Users:
${inputs.targetUsers}

Key Features:
${inputs.features}

${techStackInfo}

Generate the checklist. Ensure tasks are logical, sequential where necessary, and cover the key aspects of the project based on the description and features.
Example task format:
- [ ] Set up Next.js project with TypeScript and Tailwind CSS.
- [ ] Implement user authentication using NextAuth.js.
- [ ] Create database schema for user profiles and posts.
- [ ] Build API endpoint for creating new posts.
- [ ] Develop frontend component for displaying posts.

Output only the Markdown checklist.
`;
} 