import { NextResponse } from 'next/server';
import { z } from 'zod'; // Need Zod here again for the enum
import { FileData, GenerationOptions, projectInputSchema as baseSchema, ProjectInputData as BaseProjectInputData, techStackSchema, generationOptionsSchema } from '@/types';
import { AIProvider } from '@/lib/store'; // Import AIProvider type
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
  console.log('Request body validated successfully:', requestBody);

  try {
    const filesToZip: FileData[] = [];
    const generationPromises: Promise<void>[] = [];

    // 1. Add static rules
    console.log('Reading static rule files...');
    for (const ruleFile of STATIC_RULES) {
      const content = await readTemplateFile(`rules/${ruleFile}`);
      filesToZip.push({ path: `.cursor/rules/${ruleFile}`, content });
    }
    console.log('Static rules added.');

    // 2. Prepare and queue AI generation tasks using LangChain
    console.log('Preparing AI generation tasks...');

    // Generate Project Rules if selected
    if (requestBody.generationOptions.rules) {
        generationPromises.push((async () => {
            try {
                const inputVars = getProjectRulesInput(requestBody);
                // Pass selected provider to LangChain function
                const content = await generateContentLangChain(requestBody.selectedAIProvider, projectRulesTemplate, inputVars);
                filesToZip.push({ path: '.cursor/rules/project-specific-rules.mdc', content: content });
                console.log('Project-specific rules generated.');
            } catch (err) {
                console.error('Failed to generate project rules:', err);
            }
        })());
    }

    // Generate Specs if selected
    for (const specType in requestBody.generationOptions.specs) {
        const key = specType as keyof GenerationOptions['specs'];
        if (requestBody.generationOptions.specs[key]) {
            generationPromises.push((async () => {
                try {
                    const inputVars = getSpecInput(key, requestBody);
                     // Pass selected provider to LangChain function
                    const content = await generateContentLangChain(requestBody.selectedAIProvider, specTemplate, inputVars);
                    const match = content.match(/--- BEGIN .*? ---\n?([\s\S]*?)\n?--- END .*? ---/);
                    const finalContent = match ? match[1].trim() : content;
                    let filePath = 'docs/';
                    if (key === 'prd') filePath += 'prd.md';
                    else if (key === 'tps') filePath += 'tps.md';
                    else if (key === 'uiUx') filePath += 'ui-ux-spec.md';
                    else if (key === 'technical') filePath += 'technical-spec.md';
                    else if (key === 'data') filePath += 'data-spec.md';
                    else if (key === 'integration') filePath += 'integration-spec.md';
                    else return;
                    filesToZip.push({ path: filePath, content: finalContent });
                    console.log(`${key} spec generated.`);
                 } catch (err) {
                    console.error(`Failed to generate ${key} spec:`, err);
                 }
            })());
        }
    }

    // Generate Checklist if selected
    if (requestBody.generationOptions.checklist) {
        generationPromises.push((async () => {
            try {
                const inputVars = getChecklistInput(requestBody);
                // Pass selected provider to LangChain function
                const content = await generateContentLangChain(requestBody.selectedAIProvider, checklistTemplate, inputVars);
                filesToZip.push({ path: 'checklist.md', content: content });
                console.log('Checklist generated.');
            } catch (err) {
                console.error('Failed to generate checklist:', err);
            }
        })());
    }

    // 3. Wait for all AI generations to complete
    console.log(`Waiting for ${generationPromises.length} AI generation tasks...`);
    await Promise.all(generationPromises);
    console.log('All AI generation tasks finished.');

    // 4. Create ZIP archive
    console.log('Creating ZIP archive...');
    const requestedDynamic = requestBody.generationOptions.rules || requestBody.generationOptions.checklist || Object.values(requestBody.generationOptions.specs).some(v => v);
    if (filesToZip.length === STATIC_RULES.length && requestedDynamic && generationPromises.length > 0) {
        console.warn("No dynamic content was successfully generated or selected despite being requested.");
        return NextResponse.json({ error: 'Failed to generate the selected dynamic content. Please check server logs or API key configuration.' }, { status: 500 }); // Added key hint
    }

    const zipBuffer = await createZipArchive(filesToZip);
    console.log('ZIP archive created.');

    // 5. Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="cursor-starter-kit-${Date.now()}.zip"`,
      },
    });

  } catch (error) {
    console.error('Error during starter kit generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    let clientErrorMessage = 'Failed to generate starter kit. An internal error occurred.';
    if (errorMessage.includes("AI Configuration Error")) {
        clientErrorMessage = errorMessage;
    } else if (errorMessage.includes("AI API call failed")) {
        if (errorMessage.includes("Incorrect API Key")) {
             clientErrorMessage = "AI Error: Incorrect API Key provided for the selected provider in .env.local."; // Updated message
        } else if (errorMessage.includes("Quota exceeded")) {
             clientErrorMessage = "AI Error: API Quota exceeded for the selected provider."; // Updated message
        } else {
            clientErrorMessage = "Failed to generate content using the AI API. Please check server logs.";
        }
    }
    return NextResponse.json({ error: clientErrorMessage }, { status: 500 });
  }
} 