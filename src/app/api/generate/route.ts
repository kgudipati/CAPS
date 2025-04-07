import { NextResponse } from 'next/server';
import { z } from 'zod'; // Need Zod here again for the enum
import { FileData, GenerationOptions, projectInputSchema as baseSchema } from '@/types'; // Removed unused BaseProjectInputData
import { AIProvider, GenerationStatusMap, GenerationItemStatus } from '@/lib/store'; // Import AIProvider type and Status types
import { readTemplateFile, createZipArchive } from '@/lib/files';
import { generateContentLangChain } from '@/lib/ai';
import {
    projectRulesTemplate,
    getProjectRulesInput,
    specTemplate,
    getSpecInput,
    checklistTemplate,
    getChecklistInput
} from '@/lib/prompts';

// Extend the base Zod schema to include the AI provider selection
const apiInputSchema = baseSchema.extend({
  selectedAIProvider: z.enum(['openai', 'google', 'anthropic']),
});

// Infer the type for the API route's validated data
type ApiInputData = z.infer<typeof apiInputSchema>;

const STATIC_RULES = [
  'general-best-practices.mdc',
  'logging-and-debugging.mdc',
  'tdd-and-testing.mdc',
  'github-commit-discipline.mdc',
  'scalability.mdc',
  'mcp-tools.mdc',
];

// Helper function to get file path for spec
function getSpecFilePath(key: keyof GenerationOptions['specs']): string | null {
    let filePath = 'docs/';
    if (key === 'prd') filePath += 'prd.md';
    else if (key === 'tps') filePath += 'tps.md';
    else if (key === 'uiUx') filePath += 'ui-ux-spec.md';
    else if (key === 'technical') filePath += 'technical-spec.md';
    else if (key === 'data') filePath += 'data-spec.md';
    else if (key === 'integration') filePath += 'integration-spec.md';
    else return null;
    return filePath;
}

export async function POST(request: Request) {
  console.log('Received POST request to /api/generate');
  let requestJson;
  try {
      requestJson = await request.json();
  } catch (error) {
      console.error('Error parsing request JSON:', error);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate input using the extended schema
  const validationResult = apiInputSchema.safeParse(requestJson);
  if (!validationResult.success) {
      console.error('Input validation failed:', validationResult.error.errors);
      const formattedErrors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: `Invalid input: ${formattedErrors}` }, { status: 400 });
  }

  // Use validated data including the provider
  const requestBody: ApiInputData = validationResult.data;
  console.log('Request body validated successfully.');

  try {
    const filesToZip: FileData[] = [];
    // Store promises with their corresponding keys for status tracking
    const generationTasks: { key: keyof GenerationStatusMap; promise: Promise<FileData | null> }[] = [];

    // 1. Add static rules
    console.log('Reading static rule files...');
    for (const ruleFile of STATIC_RULES) {
      try {
        const content = await readTemplateFile(`rules/${ruleFile}`);
        filesToZip.push({ path: `.cursor/rules/${ruleFile}`, content });
      } catch (readError) {
        console.error(`Failed to read static rule file ${ruleFile}:`, readError);
        // Optionally decide if this is fatal or just log and continue
      }
    }
    console.log('Static rules added.');

    // 2. Prepare and queue AI generation tasks
    console.log('Preparing AI generation tasks...');

    // Generate Project Rules if selected
    if (requestBody.generationOptions.rules) {
        const taskKey: keyof GenerationStatusMap = 'rules';
        generationTasks.push({
            key: taskKey,
            promise: (async () => {
                try {
                    const inputVars = getProjectRulesInput(requestBody);
                    const content = await generateContentLangChain(requestBody.selectedAIProvider, projectRulesTemplate, inputVars);
                    console.log('Project-specific rules generated.');
                    return { path: '.cursor/rules/project-specific-rules.mdc', content: content };
                } catch (err) {
                    console.error('Failed to generate project rules:', err);
                    throw err; // Re-throw to be caught by allSettled
                }
            })()
        });
    }

    // Generate Specs if selected
    for (const specType in requestBody.generationOptions.specs) {
        const key = specType as keyof GenerationOptions['specs'];
        if (requestBody.generationOptions.specs[key]) {
            const taskKey = key as keyof GenerationStatusMap;
            const filePath = getSpecFilePath(key);
            if (!filePath) continue; // Skip if spec type has no defined path

            generationTasks.push({
                key: taskKey,
                promise: (async () => {
                    try {
                        const inputVars = getSpecInput(key, requestBody);
                        const content = await generateContentLangChain(requestBody.selectedAIProvider, specTemplate, inputVars);
                        const match = content.match(/--- BEGIN .*? ---\n?([\s\S]*?)\n?--- END .*? ---/);
                        const finalContent = match ? match[1].trim() : content;
                        console.log(`${key} spec generated.`);
                        return { path: filePath, content: finalContent };
                    } catch (err) {
                        console.error(`Failed to generate ${key} spec:`, err);
                        throw err; // Re-throw
                    }
                })()
            });
        }
    }

    // Generate Checklist if selected
    if (requestBody.generationOptions.checklist) {
        const taskKey: keyof GenerationStatusMap = 'checklist';
        generationTasks.push({
            key: taskKey,
            promise: (async () => {
                try {
                    const inputVars = getChecklistInput(requestBody);
                    const content = await generateContentLangChain(requestBody.selectedAIProvider, checklistTemplate, inputVars);
                    console.log('Checklist generated.');
                    return { path: 'checklist.md', content: content };
                } catch (err) {
                    console.error('Failed to generate checklist:', err);
                    throw err; // Re-throw
                }
            })()
        });
    }

    // 3. Wait for all AI generations to settle
    console.log(`Waiting for ${generationTasks.length} AI generation tasks to settle...`);
    const settledResults = await Promise.allSettled(generationTasks.map(task => task.promise));
    console.log('All AI generation tasks settled.');

    // 4. Process results and build status map
    const generationResults: Partial<GenerationStatusMap> = {};
    let generatedFileCount = 0;

    settledResults.forEach((result, index) => {
        const taskKey = generationTasks[index].key;
        if (result.status === 'fulfilled' && result.value) {
            filesToZip.push(result.value);
            generationResults[taskKey] = 'success';
            generatedFileCount++;
        } else {
            generationResults[taskKey] = 'error';
            console.error(`Task for ${taskKey} failed:`, result.status === 'rejected' ? result.reason : 'No file data returned');
        }
    });

    // 5. Create ZIP archive
    console.log('Creating ZIP archive...');
    const requestedDynamicCount = generationTasks.length;
    if (filesToZip.length === STATIC_RULES.length && requestedDynamicCount > 0) {
        console.warn("No dynamic content was successfully generated or selected despite being requested.");
        // Still return status, but indicate overall failure maybe?
        // For now, just return status and empty zip (or potentially error)
        // Let frontend decide how to handle based on status
    }

    const zipBuffer = await createZipArchive(filesToZip);
    const zipBase64 = zipBuffer.toString('base64');
    console.log('ZIP archive created and encoded.');

    // 6. Return JSON response with status and ZIP data
    return NextResponse.json({
        results: generationResults,
        zipData: zipBase64
    });

  } catch (error) {
    // Catch broader errors (e.g., JSON parsing, validation, zip creation)
    console.error('Error during starter kit generation process:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Return a generic error, specific errors handled by Promise.allSettled results
    return NextResponse.json({ error: `Generation failed: ${errorMessage}` }, { status: 500 });
  }
} 