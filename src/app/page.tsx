'use client'; // Required for hooks like useState and store access

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextAreaInput from '@/components/TextAreaInput';
import CheckboxGroup from '@/components/CheckboxGroup';
import BadgeInput from '@/components/BadgeInput'; // Import BadgeInput
import { useProjectInputStore, AIProvider } from '@/lib/store';
import { ProjectInputState, TechStack, GenerationOptions, ProjectInputData } from '@/types'; // Add GenerationOptions and ProjectInputData
import { TECH_CHOICES } from '@/lib/constants'; // Import tech choices

// Define generation options (tech stack options removed)
// const techStackOptions = [ ... ]; // Removed

const generationOptions = {
  rules: [{ id: 'gen-rules', label: 'Project-specific Rules' }],
  specs: [
    { id: 'spec-prd', label: 'PRD' },
    { id: 'spec-tps', label: 'TPS' },
    { id: 'spec-uiux', label: 'UI/UX Spec' },
    { id: 'spec-tech', label: 'Technical Spec' },
    { id: 'spec-data', label: 'Data Spec' },
    { id: 'spec-integ', label: 'Integration Spec' },
  ],
  checklist: [{ id: 'gen-checklist', label: 'Task Checklist' }],
};

// Mapping from store keys to option IDs (inverse of the one in handleGenerationOptionChange)
const specKeyToOptionIdMap: { [key in keyof GenerationOptions['specs']]: string } = {
    prd: 'spec-prd',
    tps: 'spec-tps',
    uiUx: 'spec-uiux',
    technical: 'spec-tech',
    data: 'spec-data',
    integration: 'spec-integ',
};

const TOTAL_STEPS = 5; // Corresponds to currentStep 0-4

// Step Titles and Subtitles
const stepInfo = [
  { title: "Project Overview", subtitle: "Tell us about your core idea and choose your AI partner." },
  { title: "Problem & Users", subtitle: "Define the core problem and who you're solving it for." },
  { title: "Key Features", subtitle: "List the main features your project will offer." },
  { title: "Technology Stack", subtitle: "Specify the technologies you plan to use (optional)." },
  { title: "Generation Options", subtitle: "Select the documents and artifacts you want to generate." },
];

export default function HomePage() {
  const store = useProjectInputStore();

  const handleTextChange = (field: keyof Pick<ProjectInputData, 'projectDescription' | 'problemStatement' | 'features' | 'targetUsers'>) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    store.updateField(field, e.target.value);
  };

  // Handler for Tech Stack Text Inputs
  const handleAddTechItem = (field: keyof TechStack, item: string) => {
    store.addTechStackItem(field, item);
  };
  const handleRemoveTechItem = (field: keyof TechStack, item: string) => {
    store.removeTechStackItem(field, item);
  };

  const handleGenerationOptionChange = (type: 'rules' | 'specs' | 'checklist', optionId: string, isChecked: boolean) => {
     console.log('Generation Option Change:', type, optionId, isChecked);

     // Type assertion for keys based on type
     let key: keyof GenerationOptions['specs'] | 'rules' | 'checklist';

     if (type === 'rules') {
         key = 'rules';
     } else if (type === 'checklist') {
         key = 'checklist';
     } else if (type === 'specs') {
         const specKeyMap: { [id: string]: keyof GenerationOptions['specs'] } = {
             'spec-prd': 'prd',
             'spec-tps': 'tps',
             'spec-uiux': 'uiUx',
             'spec-tech': 'technical',
             'spec-data': 'data',
             'spec-integ': 'integration',
         };
         const mappedKey = specKeyMap[optionId];
         if (!mappedKey) {
             console.error(`Invalid spec optionId: ${optionId}`);
             return;
         }
         key = mappedKey;
     } else {
         console.error(`Invalid generation option type: ${type}`);
         return;
     }

     // Call store action with correctly typed key
     store.updateGenerationOption(type, key, isChecked);
  };

  // Handler for AI Provider selection
  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    store.setSelectedAIProvider(event.target.value as AIProvider);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (store.currentStep !== TOTAL_STEPS - 1) return; // Only submit on last step

    store.setLoading(true);
    store.setError(null);

    const currentState = useProjectInputStore.getState();
    const formData = {
        projectDescription: currentState.projectDescription,
        problemStatement: currentState.problemStatement,
        features: currentState.features,
        targetUsers: currentState.targetUsers,
        techStack: currentState.techStack,
        generationOptions: currentState.generationOptions,
        selectedAIProvider: currentState.selectedAIProvider,
    };
    console.log('Submitting form data:', formData);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) { /* Ignore */ }
        throw new Error(errorData?.error || `HTTP error! status: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'cursor-starter-kit.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?($|;)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      console.log('ZIP downloaded successfully');

    } catch (err) {
        console.error("Form submission error:", err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred during generation.';
        store.setError(message);
    } finally {
        store.setLoading(false);
    }
  };

  // --- Animation Variants (Fade Only) ---
  const variants = {
    enter: {
      opacity: 0 // Start invisible
    },
    center: {
      zIndex: 1,
      opacity: 1 // Fade in
    },
    exit: {
      zIndex: 0,
      opacity: 0 // Fade out
    }
  };

  const transitionConfig = {
    opacity: { duration: 0.4 } // Control fade speed
  };

  const [direction, setDirection] = React.useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    if (newDirection > 0) {
      store.goToNextStep();
    } else {
      store.goToPrevStep();
    }
  };

  // --- Render Logic ---
  const renderStepContent = () => {
      switch (store.currentStep) {
          case 0:
              return (
                  <div className="space-y-8">
                      <TextAreaInput
                          label="Describe your project idea in a paragraph"
                          id="projectDescription"
                          value={store.projectDescription}
                          onChange={handleTextChange('projectDescription')}
                          required
                          placeholder="E.g., A web application for tracking daily water intake..."
                          rows={5}
                      />
                      <fieldset>
                          <legend className="block text-sm font-medium text-text-secondary mb-3">Select AI Provider</legend>
                          <div className="flex flex-wrap gap-x-8 gap-y-4">
                              {(['openai', 'google', 'anthropic'] as AIProvider[]).map((provider) => (
                                  <div key={provider} className="flex items-center">
                                      <input
                                          id={provider}
                                          name="ai-provider"
                                          type="radio"
                                          value={provider}
                                          checked={store.selectedAIProvider === provider}
                                          onChange={handleProviderChange}
                                          className="focus:ring-accent h-4 w-4 text-accent bg-card border-border rounded-full"
                                      />
                                      <label htmlFor={provider} className="ml-2 block text-sm font-medium text-text-primary capitalize">
                                          {provider}
                                      </label>
                                  </div>
                              ))}
                          </div>
                      </fieldset>
                  </div>
              );
          case 1:
              return (
                  <div className="space-y-8">
                      <TextAreaInput
                          label="What problem(s) does it solve for users?"
                          id="problemStatement"
                          value={store.problemStatement}
                          onChange={handleTextChange('problemStatement')}
                          required
                          placeholder="E.g., Users often forget to drink enough water..."
                          rows={4}
                      />
                      <TextAreaInput
                          label="Who are the target users?"
                          id="targetUsers"
                          value={store.targetUsers}
                          onChange={handleTextChange('targetUsers')}
                          required
                          placeholder="E.g., Health-conscious individuals..."
                          rows={4}
                      />
                  </div>
              );
           case 2:
              return (
                  <div className="space-y-8">
                      <TextAreaInput
                          label="What features will users have access to?"
                          id="features"
                          value={store.features}
                          onChange={handleTextChange('features')}
                          required
                          placeholder="E.g., Log intake, set goals, view charts..."
                          rows={6}
                      />
                  </div>
              );
           case 3:
              return (
                  <div className="space-y-8">
                    <p className="text-sm text-text-secondary -mt-4 mb-4">Select or type technologies you plan to use.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                       <BadgeInput
                            label="Frontend"
                            id="tech-frontend"
                            selectedItems={store.techStack.frontend}
                            availableChoices={TECH_CHOICES.frontend}
                            onAdd={(item) => handleAddTechItem('frontend', item)}
                            onRemove={(item) => handleRemoveTechItem('frontend', item)}
                            placeholder="e.g., React, Next.js"
                       />
                       <BadgeInput
                            label="Backend"
                            id="tech-backend"
                            selectedItems={store.techStack.backend}
                            availableChoices={TECH_CHOICES.backend}
                            onAdd={(item) => handleAddTechItem('backend', item)}
                            onRemove={(item) => handleRemoveTechItem('backend', item)}
                            placeholder="e.g., Node.js, Python"
                       />
                       <BadgeInput
                            label="Database"
                            id="tech-database"
                            selectedItems={store.techStack.database}
                            availableChoices={TECH_CHOICES.database}
                            onAdd={(item) => handleAddTechItem('database', item)}
                            onRemove={(item) => handleRemoveTechItem('database', item)}
                            placeholder="e.g., PostgreSQL"
                       />
                       <BadgeInput
                            label="Infrastructure/Hosting"
                            id="tech-infrastructure"
                            selectedItems={store.techStack.infrastructure}
                            availableChoices={TECH_CHOICES.infrastructure}
                            onAdd={(item) => handleAddTechItem('infrastructure', item)}
                            onRemove={(item) => handleRemoveTechItem('infrastructure', item)}
                            placeholder="e.g., Vercel, AWS"
                       />
                       <BadgeInput
                            label="Other Tools/Libraries"
                            id="tech-other"
                            selectedItems={store.techStack.other}
                            availableChoices={TECH_CHOICES.other}
                            onAdd={(item) => handleAddTechItem('other', item)}
                            onRemove={(item) => handleRemoveTechItem('other', item)}
                            placeholder="e.g., Zustand, Stripe"
                       />
                    </div>
        </div>
              );
           case 4:
              return (
                  <div className="space-y-8">
                    <div className="space-y-8">
                      <CheckboxGroup
                        legend="Generate Rules?"
                        options={generationOptions.rules}
                        selectedValues={store.generationOptions.rules ? [generationOptions.rules[0].id] : []}
                        onChange={(id, checked) => handleGenerationOptionChange('rules', id, checked)}
                      />
                       <CheckboxGroup
                        legend="Generate Specs? (Select all that apply)"
                        options={generationOptions.specs}
                        selectedValues={Object.entries(store.generationOptions.specs)
                          .filter(([, value]) => value)
                          .map(([key]) => specKeyToOptionIdMap[key as keyof GenerationOptions['specs']])
                          .filter(id => !!id)}
                        onChange={(id, checked) => handleGenerationOptionChange('specs', id, checked)}
                      />
                       <CheckboxGroup
                        legend="Generate Checklist?"
                        options={generationOptions.checklist}
                        selectedValues={store.generationOptions.checklist ? [generationOptions.checklist[0].id] : []}
                        onChange={(id, checked) => handleGenerationOptionChange('checklist', id, checked)}
                      />
                    </div>
    </div>
  );
          default: return null;
      }
  };

  return (
    <div className="min-h-screen p-6 sm:p-8 flex flex-col">
      <header className="w-full mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold text-text-primary">CAPS</h1>
      </header>

      <div className="flex-grow flex items-center justify-center w-full overflow-hidden">
        <div className="flex items-start justify-center w-full max-w-5xl h-full">
          <main className="flex flex-col flex-1 max-w-4xl p-12 bg-card rounded-xl shadow-lg relative overflow-hidden">

            {store.error && (
              <div className="absolute top-0 left-0 right-0 bg-red-500/30 border-b border-red-500/50 text-red-100 px-4 py-2 text-sm z-20 flex items-center justify-center" role="alert">
                <span className="font-semibold mr-2">Error:</span> {store.error}
              </div>
            )}

            <div className={`flex-grow overflow-y-auto ${store.error ? 'mt-10' : ''}`}>
                <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm pt-0 pb-6 mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">{stepInfo[store.currentStep]?.title || 'Step'}</h2>
                  <p className="text-sm text-text-secondary mt-1">{stepInfo[store.currentStep]?.subtitle || 'Please provide the details below.'}</p>
                </div>
                <div className="relative min-h-[350px]">
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={store.currentStep}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={transitionConfig}
                      className="absolute inset-0"
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
            </div>

            <div className="flex-shrink-0 mt-8 pt-6 border-t border-border flex justify-between items-center z-10">
              {store.currentStep > 0 ? (
                <button
                  onClick={() => paginate(-1)}
                  className="text-accent hover:text-accent-hover font-medium transition duration-150 ease-in-out disabled:opacity-50 disabled:text-accent/50"
                  disabled={store.isLoading}
                >
                  Previous
                </button>
              ) : <div /> /* Placeholder */}

              <button
                onClick={(e) => store.currentStep === TOTAL_STEPS - 1 ? handleSubmit(e as any) : paginate(1)}
                className={`bg-accent text-background px-6 py-2.5 rounded-lg font-semibold hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-card disabled:opacity-60 disabled:bg-accent/50 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-md ${store.isLoading ? 'animate-pulse' : ''}`}
                disabled={store.isLoading}
              >
                {store.isLoading
                    ? (store.currentStep === TOTAL_STEPS - 1 ? 'Generating...' : 'Loading...')
                    : (store.currentStep === TOTAL_STEPS - 1 ? 'Create Project Setup' : 'Next')}
              </button>
            </div>

          </main>

          <div className="flex-shrink-0 flex flex-col justify-start space-y-4 ml-8 pt-12">
            {[...Array(TOTAL_STEPS)].map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${store.currentStep === i ? 'bg-accent' : 'bg-border hover:bg-border/70'}`}
                title={`Step ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
