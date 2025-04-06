import { create } from 'zustand';
import { ProjectInputState, TechStack, GenerationOptions } from '@/types';

// Define the initial state structure more explicitly
const initialTechStack: TechStack = {
  frontend: [],
  backend: [],
  database: [],
  infrastructure: [],
  other: [],
};

const initialGenerationOptions: GenerationOptions = {
  rules: true,
  specs: {
    prd: true,
    tps: true,
    uiUx: true,
    technical: true,
    data: true,
    integration: true,
  },
  checklist: true,
};

const initialState: Omit<ProjectInputState, 'apiKey'> = { // Exclude apiKey from client-side state
  projectDescription: '',
  problemStatement: '',
  features: '',
  targetUsers: '',
  techStack: initialTechStack,
  generationOptions: initialGenerationOptions,
  isLoading: false,
  error: null,
};

// Define the store actions (methods to update state)
interface ProjectInputActions {
  updateField: (field: keyof Omit<ProjectInputState, 'techStack' | 'generationOptions' | 'isLoading' | 'error'>, value: string) => void;
  // TODO: Add more specific updaters for nested state like techStack and generationOptions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create the Zustand store
export const useProjectInputStore = create<Omit<ProjectInputState, 'apiKey'> & ProjectInputActions>((set) => ({
  ...initialState,

  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),

  // Placeholder for more complex updates - needs implementation
  // updateTechStack: (category, items) => set((state) => ({ ...state, techStack: { ...state.techStack, [category]: items }})),
  // updateGenerationOption: (type, key, value) => set((state) => ({ ... })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
})); 