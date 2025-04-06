import { create } from 'zustand';
import { ProjectInputState, TechStack, GenerationOptions } from '@/types';

// Define supported AI providers
export type AIProvider = 'openai' | 'google' | 'anthropic';

// Define the state structure including the AI provider selection
interface CAPSState extends Omit<ProjectInputState, 'apiKey'> { // Reuse existing type excluding apiKey
  selectedAIProvider: AIProvider;
}

// Define actions including one for the AI provider
interface CAPSActions {
  updateField: (field: keyof Omit<CAPSState, 'techStack' | 'generationOptions' | 'isLoading' | 'error' | 'selectedAIProvider'>, value: string) => void;
  updateTechStackField: (field: keyof TechStack, value: string) => void;
  updateGenerationOption: (type: 'rules' | 'specs' | 'checklist', key: keyof GenerationOptions['specs'] | 'rules' | 'checklist', value: boolean) => void;
  setSelectedAIProvider: (provider: AIProvider) => void; // New action
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

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

// Define the complete initial state
const initialState: CAPSState = {
  projectDescription: '',
  problemStatement: '',
  features: '',
  targetUsers: '',
  techStack: initialTechStack,
  generationOptions: initialGenerationOptions,
  selectedAIProvider: 'openai', // Default to OpenAI
  isLoading: false,
  error: null,
};

// Create the Zustand store
export const useProjectInputStore = create<CAPSState & CAPSActions>((set) => ({
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

  setSelectedAIProvider: (provider) => set({ selectedAIProvider: provider }), // Implement new action

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }), // Ensure reset sets the default provider too
})); 