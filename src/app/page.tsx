'use client'; // Required for hooks like useState and store access

import React from 'react';
import TextAreaInput from '@/components/TextAreaInput';
import CheckboxGroup from '@/components/CheckboxGroup'; // Assuming basic CheckboxGroup for now
import { useProjectInputStore } from '@/lib/store';
import { ProjectInputState } from '@/types'; // Import the main state type

// Define options for checkboxes (will need refinement for nested structure)
const techStackOptions = [
  { id: 'frontend-react', label: 'React' },
  { id: 'frontend-vue', label: 'Vue' },
  { id: 'backend-node', label: 'Node.js' },
  { id: 'db-postgres', label: 'PostgreSQL' },
];

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

export default function HomePage() {
  // Get the entire state and actions
  const store = useProjectInputStore();

  const handleTextChange = (field: keyof Pick<ProjectInputState, 'projectDescription' | 'problemStatement' | 'features' | 'targetUsers'>) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    store.updateField(field, e.target.value);
  };

  // TODO: Implement actual state update logic for checkboxes
  const handleTechStackChange = (optionId: string, isChecked: boolean) => {
    console.log('Tech Stack Change:', optionId, isChecked);
    // store.updateTechStack(...);
  };

  const handleGenerationOptionChange = (type: 'rules' | 'specs' | 'checklist', optionId: string, isChecked: boolean) => {
     console.log('Generation Option Change:', type, optionId, isChecked);
     // store.updateGenerationOption(type, optionId, isChecked);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    store.setLoading(true);
    store.setError(null);

    // Prepare data for API (pick only necessary fields)
    const currentState = useProjectInputStore.getState();
    const formData = {
        projectDescription: currentState.projectDescription,
        problemStatement: currentState.problemStatement,
        features: currentState.features,
        targetUsers: currentState.targetUsers,
        techStack: currentState.techStack, // TODO: Ensure this structure is correct/handled by API
        generationOptions: currentState.generationOptions, // TODO: Ensure this structure is correct/handled by API
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
          <p className="text-sm text-gray-600 mb-3">Select the technologies you plan to use, or let the AI decide based on your project description.</p>
          {/* TODO: Implement component and state logic for nested tech stack categories */}
          <CheckboxGroup
            legend="Select Technologies"
            options={techStackOptions}
             selectedValues={[] /* Placeholder - Get actual value from store.techStack */} 
            onChange={handleTechStackChange}
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Generation Options</h2>
          <div className="space-y-4">
            {/* TODO: Implement component and state logic for generation options */}
            <CheckboxGroup
              legend="Generate Rules?"
              options={generationOptions.rules}
               selectedValues={store.generationOptions.rules ? [generationOptions.rules[0].id] : [] /* Placeholder */} 
              onChange={(id, checked) => handleGenerationOptionChange('rules', id, checked)}
            />
             <CheckboxGroup
              legend="Generate Specs?"
              options={generationOptions.specs}
               selectedValues={Object.entries(store.generationOptions.specs)
                .filter(([, v]) => v)
                .map(([k]) => generationOptions.specs.find(opt => opt.id.includes(k))?.id ?? '')
                .filter(id => id) /* Placeholder */} 
              onChange={(id, checked) => handleGenerationOptionChange('specs', id, checked)}
            />
             <CheckboxGroup
              legend="Generate Checklist?"
              options={generationOptions.checklist}
               selectedValues={store.generationOptions.checklist ? [generationOptions.checklist[0].id] : [] /* Placeholder */} 
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
