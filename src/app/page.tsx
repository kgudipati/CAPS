'use client'; // Required for hooks like useState and store access

import React from 'react';
import TextAreaInput from '@/components/TextAreaInput';
import CheckboxGroup from '@/components/CheckboxGroup'; // Assuming basic CheckboxGroup for now
import { useProjectInputStore } from '@/lib/store';

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
  const {
    projectDescription,
    problemStatement,
    features,
    targetUsers,
    // techStack, // Need specific handler for nested state
    // generationOptions: genOpts, // Need specific handler for nested state
    isLoading,
    error,
    updateField,
    setLoading,
    setError,
    // Add specific update functions when implemented in store
  } = useProjectInputStore();

  const handleTextChange = (field: Parameters<typeof updateField>[0]) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateField(field, e.target.value);
    };

  // Placeholder handlers for complex state - needs implementation in store & component
  const handleTechStackChange = (optionId: string, isChecked: boolean) => {
    console.log('Tech Stack Change:', optionId, isChecked); // TODO: Implement store logic
    // Example: updateTechStack(category, updatedItems);
  };

  const handleGenerationOptionChange = (type: string, optionId: string, isChecked: boolean) => {
    console.log('Generation Option Change:', type, optionId, isChecked); // TODO: Implement store logic
    // Example: updateGenerationOption(type, key, isChecked);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    console.log('Submitting form...'); // Placeholder for API call

    // TODO: 1. Get full state from store
    // TODO: 2. Validate inputs (especially API key - though that moves server-side)
    // TODO: 3. Make POST request to /api/generate
    // TODO: 4. Handle response (download zip or show error)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Example error handling
    // setError("Failed to generate kit. Please try again.");

    setLoading(false);
  };

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Create Your Cursor Project Starter Kit
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Project Details</h2>
          <TextAreaInput
            label="Describe the project in one paragraph"
            id="projectDescription"
            value={projectDescription}
            onChange={handleTextChange('projectDescription')}
            required
            placeholder="E.g., A web application that allows users to track their daily water intake..."
          />
          <TextAreaInput
            label="What problem(s) does it solve for users?"
            id="problemStatement"
            value={problemStatement}
            onChange={handleTextChange('problemStatement')}
            required
            placeholder="E.g., Users often forget to drink enough water throughout the day..."
          />
          <TextAreaInput
            label="What features will users have access to?"
            id="features"
            value={features}
            onChange={handleTextChange('features')}
            required
            placeholder="E.g., Log water intake, set daily goals, view progress charts, receive reminders..."
          />
          <TextAreaInput
            label="Who are the target users?"
            id="targetUsers"
            value={targetUsers}
            onChange={handleTextChange('targetUsers')}
            required
            placeholder="E.g., Health-conscious individuals, office workers, people tracking fitness goals..."
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Technology Stack (Optional)</h2>
          <p className="text-sm text-gray-600 mb-3">Select the technologies you plan to use, or let the AI decide based on your project description.</p>
          {/* TODO: Replace with a more structured component for categories (Frontend, Backend, etc.) */}
          <CheckboxGroup
            legend="Select Technologies"
            options={techStackOptions}
            selectedValues={[] /* TODO: Get from store state */} 
            onChange={handleTechStackChange}
          />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Generation Options</h2>
          <div className="space-y-4">
            <CheckboxGroup
              legend="Generate Rules?"
              options={generationOptions.rules}
              selectedValues={[] /* TODO: Get from store state */} 
              onChange={(id, checked) => handleGenerationOptionChange('rules', id, checked)}
            />
             <CheckboxGroup
              legend="Generate Specs?"
              options={generationOptions.specs}
              selectedValues={[] /* TODO: Get from store state */} 
              onChange={(id, checked) => handleGenerationOptionChange('specs', id, checked)}
            />
             <CheckboxGroup
              legend="Generate Checklist?"
              options={generationOptions.checklist}
              selectedValues={[] /* TODO: Get from store state */} 
              onChange={(id, checked) => handleGenerationOptionChange('checklist', id, checked)}
            />
          </div>
        </section>

        <div className="text-center pt-6 border-t">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Create Starter Kit'}
          </button>
        </div>
      </form>
    </main>
  );
}
