'use client'; // Required for hooks like useState and store access

import React from 'react';
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

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Create Your Cursor Project Starter Kit
      </h1>

      {store.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{store.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">AI Provider</h2>
          <p className="text-sm text-gray-600 mb-3">Select the AI provider you have configured in your <code>.env.local</code> file.</p>
          <fieldset className="mt-4">
            <legend className="sr-only">AI Provider Selection</legend>
            <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
              {(['openai', 'google', 'anthropic'] as AIProvider[]).map((provider) => (
                <div key={provider} className="flex items-center">
                  <input
                    id={provider}
                    name="ai-provider"
                    type="radio"
                    value={provider}
                    checked={store.selectedAIProvider === provider}
                    onChange={handleProviderChange}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <label htmlFor={provider} className="ml-3 block text-sm font-medium text-gray-700 capitalize">
                    {provider}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Project Details</h2>
          <TextAreaInput
            label="Describe the project in one paragraph"
            id="projectDescription"
            value={store.projectDescription}
            onChange={handleTextChange('projectDescription')}
            required
            placeholder="E.g., A web application that allows users to track their daily water intake..."
          />
          <TextAreaInput
            label="What problem(s) does it solve for users?"
            id="problemStatement"
            value={store.problemStatement}
            onChange={handleTextChange('problemStatement')}
            required
            placeholder="E.g., Users often forget to drink enough water throughout the day..."
          />
          <TextAreaInput
            label="What features will users have access to?"
            id="features"
            value={store.features}
            onChange={handleTextChange('features')}
            required
            placeholder="E.g., Log water intake, set daily goals, view progress charts, receive reminders..."
          />
          <TextAreaInput
            label="Who are the target users?"
            id="targetUsers"
            value={store.targetUsers}
            onChange={handleTextChange('targetUsers')}
            required
            placeholder="E.g., Health-conscious individuals, office workers, people tracking fitness goals..."
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Technology Stack (Optional)</h2>
          <p className="text-sm text-gray-600 mb-3">Describe the technologies you plan to use (e.g., React, Node.js, PostgreSQL, AWS S3), or leave blank to let the AI decide.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
             <TextInput
                label="Frontend"
                id="tech-frontend"
                value={store.techStack.frontend}
                onChange={handleTechStackTextChange('frontend')}
                placeholder="e.g., React, Next.js, Tailwind CSS"
             />
             <TextInput
                label="Backend"
                id="tech-backend"
                value={store.techStack.backend}
                onChange={handleTechStackTextChange('backend')}
                placeholder="e.g., Node.js, Express, Python/Django"
             />
             <TextInput
                label="Database"
                id="tech-database"
                value={store.techStack.database}
                onChange={handleTechStackTextChange('database')}
                placeholder="e.g., PostgreSQL, MongoDB, Supabase"
             />
             <TextInput
                label="Infrastructure/Hosting"
                id="tech-infrastructure"
                value={store.techStack.infrastructure}
                onChange={handleTechStackTextChange('infrastructure')}
                placeholder="e.g., Vercel, AWS (S3, EC2), Docker"
             />
             <TextInput
                label="Other Tools/Libraries"
                id="tech-other"
                value={store.techStack.other}
                onChange={handleTechStackTextChange('other')}
                placeholder="e.g., Zustand, Stripe, Auth0"
             />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Generation Options</h2>
          <div className="space-y-4">
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
                .filter(([, value]) => value) // Filter for true values
                .map(([key]) => specKeyToOptionIdMap[key as keyof GenerationOptions['specs']]) // Map key to option ID using the map
                .filter(id => !!id) // Filter out any potential undefined/null if map fails (shouldn't happen now)
              }
              onChange={(id, checked) => handleGenerationOptionChange('specs', id, checked)}
            />
            <CheckboxGroup
              legend="Generate Checklist?"
              options={generationOptions.checklist}
              selectedValues={store.generationOptions.checklist ? [generationOptions.checklist[0].id] : []}
              onChange={(id, checked) => handleGenerationOptionChange('checklist', id, checked)}
            />
          </div>
        </section>

        <div className="text-center pt-6 border-t">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            disabled={store.isLoading}
          >
            {store.isLoading ? 'Generating...' : 'Create Starter Kit'}
          </button>
        </div>
      </form>
    </main>
  );
}
