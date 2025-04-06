import { create } from 'zustand';
import { ProjectInputState, TechStack, GenerationOptions } from '@/types';

// Define supported AI providers
export type AIProvider = 'openai' | 'google' | 'anthropic';

// Define the number of steps
const TOTAL_STEPS = 5; // 0: Desc+AI, 1: Prob+Users, 2: Features, 3: Stack, 4: GenOpts

// Define the state structure including the AI provider selection and current step
interface CAPSState extends Omit<ProjectInputState, 'apiKey' | 'techStack'> { // Omit original techStack
  selectedAIProvider: AIProvider;
  currentStep: number; // Add current step state
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
    other: string[];
  }; // Use string arrays for tech stack
}

// Define actions including step navigation
interface CAPSActions {
  updateField: (field: keyof Omit<CAPSState, 'techStack' | 'generationOptions' | 'isLoading' | 'error' | 'selectedAIProvider' | 'currentStep'>, value: string) => void;
  addTechStackItem: (field: keyof CAPSState['techStack'], item: string) => void;
  removeTechStackItem: (field: keyof CAPSState['techStack'], item: string) => void;
  updateGenerationOption: (type: 'rules' | 'specs' | 'checklist', key: keyof GenerationOptions['specs'] | 'rules' | 'checklist', value: boolean) => void;
  setSelectedAIProvider: (provider: AIProvider) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  goToNextStep: () => void; // Action to go to next step
  goToPrevStep: () => void; // Action to go to previous step
}

// Define the initial state structure more explicitly
const initialTechStack: CAPSState['techStack'] = {
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

// Define the complete initial state
const initialState: CAPSState = {
  projectDescription: '',
  problemStatement: '',
  features: '',
  targetUsers: '',
  techStack: initialTechStack,
  generationOptions: initialGenerationOptions,
  selectedAIProvider: 'openai', // Default to OpenAI
  currentStep: 0, // Start at step 0
  isLoading: false,
  error: null,
};

// Create the Zustand store
export const useProjectInputStore = create<CAPSState & CAPSActions>((set, get) => ({
  ...initialState,

  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),

  addTechStackItem: (field, item) => set((state) => {
    if (!item || state.techStack[field].includes(item)) return state; // Prevent empty/duplicate adds
    return {
        ...state,
        techStack: { ...state.techStack, [field]: [...state.techStack[field], item] }
    };
  }),

  removeTechStackItem: (field, item) => set((state) => ({
      ...state,
      techStack: { ...state.techStack, [field]: state.techStack[field].filter(i => i !== item) }
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

  setSelectedAIProvider: (provider) => set({ selectedAIProvider: provider }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }), // Ensure reset resets step and provider

  // Step Navigation Actions
  goToNextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) // Prevent going beyond last step
  })),

  goToPrevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 0) // Prevent going below first step
  })),

})); 