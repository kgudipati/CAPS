'use client'; // Required for hooks like useState and store access

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextAreaInput from '@/components/TextAreaInput';
import CheckboxGroup from '@/components/CheckboxGroup';
import TextInput from '@/components/TextInput'; // Import TextInput
import { useProjectInputStore, AIProvider } from '@/lib/store';
import { ProjectInputState, TechStack, GenerationOptions, ProjectInputData } from '@/types'; // Add GenerationOptions and ProjectInputData

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

export default function HomePage() {
  const store = useProjectInputStore();

  const handleTextChange = (field: keyof Pick<ProjectInputData, 'projectDescription' | 'problemStatement' | 'features' | 'targetUsers'>) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    store.updateField(field, e.target.value);
  };

  // Handler for Tech Stack Text Inputs
  const handleTechStackTextChange = (field: keyof TechStack) => (e: React.ChangeEvent<HTMLInputElement>) => {
    store.updateTechStackField(field, e.target.value);
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

  // --- Animation Variants ---
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
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
                  <>
                      <TextAreaInput
                          label="Describe your project idea in a paragraph"
                          id="projectDescription"
                          value={store.projectDescription}
                          onChange={handleTextChange('projectDescription')}
                          required
                          placeholder="E.g., A web application that allows users to track their daily water intake..."
                          rows={5}
                          className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      <fieldset className="mt-6">
                          <legend className="block text-sm font-medium text-gray-300 mb-3">Select AI Provider (configured in .env.local)</legend>
                          <div className="flex flex-wrap gap-x-6 gap-y-3">
                              {(['openai', 'google', 'anthropic'] as AIProvider[]).map((provider) => (
                                  <div key={provider} className="flex items-center">
                                      <input
                                          id={provider}
                                          name="ai-provider"
                                          type="radio"
                                          value={provider}
                                          checked={store.selectedAIProvider === provider}
                                          onChange={handleProviderChange}
                                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-400 bg-gray-600 border-gray-500"
                                      />
                                      <label htmlFor={provider} className="ml-2 block text-sm font-medium text-gray-300 capitalize">
                                          {provider}
                                      </label>
                                  </div>
                              ))}
                          </div>
                      </fieldset>
                  </>
              );
          case 1:
              return (
                  <>
                      <TextAreaInput
                          label="What problem(s) does it solve for users?"
                          id="problemStatement"
                          value={store.problemStatement}
                          onChange={handleTextChange('problemStatement')}
                          required
                          placeholder="E.g., Users often forget to drink enough water throughout the day..."
                          rows={4}
                          className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                       />
                      <TextAreaInput
                          label="Who are the target users?"
                          id="targetUsers"
                          value={store.targetUsers}
                          onChange={handleTextChange('targetUsers')}
                          required
                          placeholder="E.g., Health-conscious individuals, office workers, people tracking fitness goals..."
                          rows={4}
                          className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 mt-6"
                      />
                  </>
              );
           case 2:
              return (
                  <TextAreaInput
                      label="What features will users have access to?"
                      id="features"
                      value={store.features}
                      onChange={handleTextChange('features')}
                      required
                      placeholder="E.g., Log water intake, set daily goals, view progress charts, receive reminders..."
                      rows={6}
                      className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
              );
           case 3:
              return (
                  <>
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Technology Stack (Optional)</h3>
                    <p className="text-sm text-gray-400 mb-5">Describe the technologies you plan to use, or leave blank to let the AI decide.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                       <TextInput label="Frontend" id="tech-frontend" value={store.techStack.frontend} onChange={handleTechStackTextChange('frontend')} placeholder="e.g., React, Next.js" inputClassName="bg-gray-700 border-gray-600 text-white" />
                       <TextInput label="Backend" id="tech-backend" value={store.techStack.backend} onChange={handleTechStackTextChange('backend')} placeholder="e.g., Node.js, Python" inputClassName="bg-gray-700 border-gray-600 text-white"/>
                       <TextInput label="Database" id="tech-database" value={store.techStack.database} onChange={handleTechStackTextChange('database')} placeholder="e.g., PostgreSQL, MongoDB" inputClassName="bg-gray-700 border-gray-600 text-white"/>
                       <TextInput label="Infrastructure/Hosting" id="tech-infrastructure" value={store.techStack.infrastructure} onChange={handleTechStackTextChange('infrastructure')} placeholder="e.g., Vercel, AWS" inputClassName="bg-gray-700 border-gray-600 text-white"/>
                       <TextInput label="Other Tools/Libraries" id="tech-other" value={store.techStack.other} onChange={handleTechStackTextChange('other')} placeholder="e.g., Zustand, Stripe" inputClassName="bg-gray-700 border-gray-600 text-white"/>
                    </div>
                  </>
              );
           case 4:
              return (
                  <>
                    <h3 className="text-lg font-medium text-gray-300 mb-4">Generation Options</h3>
                    <div className="space-y-5">
                      <CheckboxGroup
                        legend="Generate Rules?"
                        options={generationOptions.rules}
                        selectedValues={store.generationOptions.rules ? [generationOptions.rules[0].id] : []}
                        onChange={(id, checked) => handleGenerationOptionChange('rules', id, checked)}
                        labelClassName="text-gray-300"
                        checkboxClassName="bg-gray-600 border-gray-500 text-indigo-400 focus:ring-indigo-500"
                      />
                       <CheckboxGroup
                        legend="Generate Specs? (Select all that apply)"
                        options={generationOptions.specs}
                        selectedValues={Object.entries(store.generationOptions.specs)
                          .filter(([, value]) => value)
                          .map(([key]) => specKeyToOptionIdMap[key as keyof GenerationOptions['specs']])
                          .filter(id => !!id)}
                        onChange={(id, checked) => handleGenerationOptionChange('specs', id, checked)}
                        labelClassName="text-gray-300"
                        checkboxClassName="bg-gray-600 border-gray-500 text-indigo-400 focus:ring-indigo-500"
                      />
                       <CheckboxGroup
                        legend="Generate Checklist?"
                        options={generationOptions.checklist}
                        selectedValues={store.generationOptions.checklist ? [generationOptions.checklist[0].id] : []}
                        onChange={(id, checked) => handleGenerationOptionChange('checklist', id, checked)}
                        labelClassName="text-gray-300"
                        checkboxClassName="bg-gray-600 border-gray-500 text-indigo-400 focus:ring-indigo-500"
                      />
                    </div>
                  </>
              );
          default: return null;
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4">
      <header className="w-full max-w-2xl mb-6">
        <h1 className="text-2xl font-bold text-white text-left">CAPS</h1>
      </header>

      <main className="w-full max-w-2xl p-8 bg-gray-800 rounded-lg shadow-xl relative overflow-hidden" style={{ minHeight: '450px' }}>

        {store.error && (
          <div className="absolute top-0 left-0 right-0 bg-red-800 border-b border-red-600 text-red-100 px-4 py-2 text-sm z-20" role="alert">
            <strong className="font-bold">Error: </strong> {store.error}
          </div>
        )}

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={store.currentStep} // Key change triggers animation
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute top-0 left-0 w-full h-full p-8 pt-12" // Adjust padding if error shown
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons - positioned absolutely within the main container */}
        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center z-10">
          {store.currentStep > 0 ? (
            <button
              onClick={() => paginate(-1)}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition duration-150 ease-in-out"
              disabled={store.isLoading}
            >
              Previous
            </button>
          ) : <div /> /* Placeholder to keep Next button right-aligned */} 

          <button
            onClick={() => store.currentStep === TOTAL_STEPS - 1 ? handleSubmit(new Event('submit') as any) : paginate(1)}
            className={`bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-800 disabled:cursor-not-allowed transition duration-150 ease-in-out ${store.isLoading ? 'animate-pulse' : ''}`}
            disabled={store.isLoading}
          >
            {store.isLoading
                ? (store.currentStep === TOTAL_STEPS - 1 ? 'Generating...' : 'Loading...')
                : (store.currentStep === TOTAL_STEPS - 1 ? 'Create Project Setup' : 'Next')}
          </button>
        </div>

      </main>

      {/* Optional: Progress Indicator */}
      <div className="flex justify-center space-x-2 mt-4">
        {[...Array(TOTAL_STEPS)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${store.currentStep === i ? 'bg-indigo-400' : 'bg-gray-600'}`}
          />
        ))}
      </div>
    </div>
  );
}
