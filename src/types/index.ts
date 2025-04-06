import { z } from 'zod';

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  infrastructure: string;
  other: string;
}

export interface GenerationOptions {
  rules: boolean;
  specs: {
    prd: boolean;
    tps: boolean;
    uiUx: boolean;
    technical: boolean;
    data: boolean;
    integration: boolean;
  };
  checklist: boolean;
}

export interface ProjectInputState {
  projectDescription: string;
  problemStatement: string;
  features: string;
  targetUsers: string;
  techStack: TechStack; // Simplified for now, maybe just strings later
  generationOptions: GenerationOptions;
  apiKey: string; // Temporary, will move to server-side only
  isLoading: boolean;
  error: string | null;
}

export interface FileData {
  path: string;
  content: string;
}

// --- Zod Schemas for API Validation --- 

export const techStackSchema = z.object({
  frontend: z.string().optional(), // Make optional as user might leave blank
  backend: z.string().optional(),
  database: z.string().optional(),
  infrastructure: z.string().optional(),
  other: z.string().optional(),
});

export const generationOptionsSchema = z.object({
  rules: z.boolean(),
  specs: z.object({
    prd: z.boolean(),
    tps: z.boolean(),
    uiUx: z.boolean(),
    technical: z.boolean(),
    data: z.boolean(),
    integration: z.boolean(),
  }),
  checklist: z.boolean(),
});

// Combined schema for the validated input data structure
export const projectInputSchema = z.object({
  projectDescription: z.string().min(10, { message: "Project description must be at least 10 characters long." }),
  problemStatement: z.string().min(10, { message: "Problem statement must be at least 10 characters long." }),
  features: z.string().min(10, { message: "Features description must be at least 10 characters long." }),
  targetUsers: z.string().min(10, { message: "Target users description must be at least 10 characters long." }),
  techStack: techStackSchema,
  generationOptions: generationOptionsSchema,
});

// Type inferred from the Zod schema - represents validated data
export type ProjectInputData = z.infer<typeof projectInputSchema>; 