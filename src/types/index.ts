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