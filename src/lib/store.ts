import { create } from 'zustand';
import { ProjectInputState, TechStack, GenerationOptions } from '@/types';

// Define supported AI providers
export type AIProvider = 'openai' | 'google' | 'anthropic';

// Define status for individual generation items
export type GenerationItemStatus = 'idle' | 'pending' | 'success' | 'error';

// Define the shape of the generation status map
export type GenerationStatusMap = {
  rules: GenerationItemStatus;
  checklist: GenerationItemStatus;
} & { // Add specs dynamically based on GenerationOptions['specs'] keys
  [K in keyof GenerationOptions['specs']]: GenerationItemStatus;
};

// Define the number of steps
const TOTAL_STEPS = 5; // 0: Desc+AI, 1: Prob+Users, 2: Features, 3: Stack, 4: GenOpts

// Define the state structure including the AI provider selection and current step
interface CAPSState extends Omit<ProjectInputState, 'apiKey' | 'techStack' | 'isLoading' | 'error'> { // Omit original fields
  selectedAIProvider: AIProvider;
  currentStep: number; // Add current step state
  isGenerating: boolean; // Renamed from isLoading
  error: string | null; // Keep error state
  generationStatus: GenerationStatusMap; // Add status map
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
    other: string[];
  }; // Use string arrays for tech stack
}

// Define actions including step navigation and status updates
interface CAPSActions {
  updateField: (field: keyof Omit<CAPSState, 'techStack' | 'generationOptions' | 'isGenerating' | 'error' | 'selectedAIProvider' | 'currentStep' | 'generationStatus'>, value: string) => void;
  addTechStackItem: (field: keyof CAPSState['techStack'], item: string) => void;
  removeTechStackItem: (field: keyof CAPSState['techStack'], item: string) => void;
  updateGenerationOption: (type: 'rules' | 'specs' | 'checklist', key: keyof GenerationOptions['specs'] | 'rules' | 'checklist', value: boolean) => void;
  setSelectedAIProvider: (provider: AIProvider) => void;
  setGenerating: (isGenerating: boolean) => void; // Renamed from setLoading
  setError: (error: string | null) => void;
  setGenerationStatuses: (statuses: Partial<GenerationStatusMap>) => void; // New action
  resetGenerationStatus: () => void; // New action
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

// Initialize generation status with all keys from initialGenerationOptions
const initialGenerationStatus: GenerationStatusMap = {
  rules: 'idle',
  checklist: 'idle',
  ...(Object.keys(initialGenerationOptions.specs) as Array<keyof GenerationOptions['specs']>).reduce((acc, key) => {
    acc[key] = 'idle';
    return acc;
  }, {} as { [K in keyof GenerationOptions['specs']]: GenerationItemStatus })
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
  isGenerating: false, // Renamed
  error: null,
  generationStatus: initialGenerationStatus, // Add initial status
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
    // Reset status when an option is toggled
    const statusKey = key as keyof GenerationStatusMap;
    const newGenerationStatus = { ...state.generationStatus, [statusKey]: 'idle' };

    if (type === 'specs') {
      const specKey = key as keyof GenerationOptions['specs'];
      return {
         ...state,
         generationOptions: {
           ...state.generationOptions,
           specs: {
             ...state.generationOptions.specs,
             [specKey]: value,
           }
         },
         generationStatus: newGenerationStatus // Update status on toggle
      }
    } else if (type === 'rules' || type === 'checklist') {
        const simpleKey = key as 'rules' | 'checklist';
        return {
            ...state,
            generationOptions: {
                ...state.generationOptions,
                [simpleKey]: value
            },
            generationStatus: newGenerationStatus // Update status on toggle
        }
    }
    console.warn(`Invalid type passed to updateGenerationOption: ${type}`);
    return state; // Return current state if type is invalid
  }),

  setSelectedAIProvider: (provider) => set({ selectedAIProvider: provider }),

  setGenerating: (isGenerating) => set({ isGenerating }), // Renamed

  setError: (error) => set({ error }),

  // Action to update multiple statuses at once
  setGenerationStatuses: (statuses) => set((state) => ({
    generationStatus: { ...state.generationStatus, ...statuses }
  })),

  // Action to reset all statuses to idle
  resetGenerationStatus: () => set({ generationStatus: initialGenerationStatus }),

  // Modify reset to include resetting statuses
  reset: () => set((state) => ({
    ...initialState,
    // Keep current step if needed, or reset fully:
    // currentStep: state.currentStep // Example: keep step
  })),

  // Step Navigation Actions
  goToNextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1) // Prevent going beyond last step
  })),

  goToPrevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 0) // Prevent going below first step
  })),

})); 