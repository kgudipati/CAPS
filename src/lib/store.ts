import { create } from 'zustand';
import { ProjectInputState, TechStack, GenerationOptions } from '@/types';

// Define the initial state structure more explicitly
const initialTechStack: TechStack = {
  frontend: '',
  backend: '',
  database: '',
  infrastructure: '',
  other: '',
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
  updateTechStackField: (field: keyof TechStack, value: string) => void;
  updateGenerationOption: (type: 'rules' | 'specs' | 'checklist', key: keyof GenerationOptions['specs'] | 'rules' | 'checklist', value: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Create the Zustand store
export const useProjectInputStore = create<Omit<ProjectInputState, 'apiKey'> & ProjectInputActions>((set) => ({
  ...initialState,

  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),

  updateTechStackField: (field, value) => set((state) => ({
    ...state,
    techStack: { ...state.techStack, [field]: value },
  })),

  updateGenerationOption: (type, key, value) => set((state) => {
    if (type === 'specs') {
      // Ensure the key is treated as a spec key
      const specKey = key as keyof GenerationOptions['specs'];
      return {
         ...state,
         generationOptions: {
           ...state.generationOptions,
           specs: {
             ...state.generationOptions.specs,
             [specKey]: value,
           }
         }
      }
    } else if (type === 'rules' || type === 'checklist') {
        // Ensure the key is treated as rules or checklist
        const simpleKey = key as 'rules' | 'checklist';
        return {
            ...state,
            generationOptions: {
                ...state.generationOptions,
                [simpleKey]: value
            }
        }
    }
    console.warn(`Invalid type passed to updateGenerationOption: ${type}`);
    return state; // Return current state if type is invalid
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
})); 