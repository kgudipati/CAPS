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
    const generationResults: { [key: string]: string } = {}; // Store results for context
    const independentPromises: Promise<void>[] = [];

    // 1. Add static rules
    console.log('Reading static rule files...');
    for (const ruleFile of STATIC_RULES) {
      const content = await readTemplateFile(`rules/${ruleFile}`);
      filesToZip.push({ path: `.cursor/rules/${ruleFile}`, content });
    }
    console.log('Static rules added.');

    // 2. Prepare and queue INDEPENDENT AI generation tasks (Rules, Specs)
    console.log('Preparing independent AI generation tasks...');

    // Generate Project Rules if selected
    if (requestBody.generationOptions.rules) {
        independentPromises.push((async () => {
            try {
                const inputVars = getProjectRulesInput(requestBody);
                const content = await generateContentLangChain(requestBody.selectedAIProvider, projectRulesTemplate, inputVars);
                const path = '.cursor/rules/project-specific-rules.mdc';
                filesToZip.push({ path, content });
                generationResults['rules'] = content; // Store result
                console.log('Project-specific rules generated.');
            } catch (err) {
                console.error('Failed to generate project rules:', err);
                generationResults['rules'] = `Error generating rules: ${err instanceof Error ? err.message : err}`;
            }
        })());
    }

    // Generate Specs if selected
    const specTypes = Object.keys(requestBody.generationOptions.specs) as Array<keyof GenerationOptions['specs']>;
    for (const specType of specTypes) {
        if (requestBody.generationOptions.specs[specType]) {
            independentPromises.push((async () => {
                try {
                    const inputVars = getSpecInput(specType, requestBody);
                    const rawContent = await generateContentLangChain(requestBody.selectedAIProvider, specTemplate, inputVars);
                    // Extract content between BEGIN/END markers, fallback to raw content
                    const match = rawContent.match(/--- BEGIN .*? ---\n?([sS]*?)\n?--- END .*? ---/);
                    const content = match ? match[1].trim() : rawContent.trim();

                    let fileName = '';
                    if (specType === 'prd') fileName = 'prd.md';
                    else if (specType === 'tps') fileName = 'tps.md';
                    else if (specType === 'uiUx') fileName = 'ui-ux-spec.md';
                    else if (specType === 'technical') fileName = 'technical-spec.md';
                    else if (specType === 'data') fileName = 'data-spec.md';
                    else if (specType === 'integration') fileName = 'integration-spec.md';
                    else return; // Skip if unknown spec type somehow

                    const path = `docs/${fileName}`;
                    filesToZip.push({ path, content });
                    generationResults[specType] = content; // Store result
                    console.log(`${specType} spec generated.`);
                 } catch (err) {
                    console.error(`Failed to generate ${specType} spec:`, err);
                    generationResults[specType] = `Error generating ${specType} spec: ${err instanceof Error ? err.message : err}`;
                 }
            })());
        }
    }

    // 3. Wait for all INDEPENDENT AI generations to complete
    console.log(`Waiting for ${independentPromises.length} independent AI generation tasks...`);
    await Promise.all(independentPromises);
    console.log('All independent AI generation tasks finished.');

    // 4. Generate Checklist if selected (SEQUENTIAL, uses results)
    if (requestBody.generationOptions.checklist) {
        console.log('Preparing checklist generation task with context...');
        try {
            // Prepare context from previous results
            let context = "## Previously Generated Artifacts Context:\n\n";
            if (generationResults['rules']) {
                context += "### Project Rules:\n" + generationResults['rules'] + "\n\n";
            }
            const generatedSpecs = specTypes
                .filter(specType => generationResults[specType] && !generationResults[specType].startsWith('Error'))
                .map(specType => `### ${specType.toUpperCase()} Specification:\n${generationResults[specType]}`)
                .join("\n\n");

            if (generatedSpecs) {
                context += "### Specifications:\n" + generatedSpecs;
            } else if (!generationResults['rules']) {
                context = "No prior context generated."; // Handle case where nothing was generated before checklist
            }

            const inputVars = getChecklistInput(requestBody, context.trim()); // Pass context
            const content = await generateContentLangChain(requestBody.selectedAIProvider, checklistTemplate, inputVars);
            filesToZip.push({ path: 'checklist.md', content });
            console.log('Checklist generated with context.');
        } catch (err) {
            console.error('Failed to generate checklist:', err);
            // Optionally add an error file or skip adding the checklist
            filesToZip.push({ path: 'checklist.md', content: `Error generating checklist: ${err instanceof Error ? err.message : err}` });
        }
    }

    // 5. Create ZIP archive
    console.log('Creating ZIP archive...');
    const requestedDynamic = requestBody.generationOptions.rules || requestBody.generationOptions.checklist || Object.values(requestBody.generationOptions.specs).some(v => v);
    const successfulGenerations = Object.values(generationResults).some(content => !content.startsWith('Error')) || (requestBody.generationOptions.checklist && filesToZip.some(f => f.path === 'checklist.md' && !f.content.startsWith('Error')));

    // Adjust error check: Ensure *some* dynamic content was generated if requested
    if (requestedDynamic && !successfulGenerations) {
         console.warn("No dynamic content was successfully generated despite being requested.");
         return NextResponse.json({ error: 'Failed to generate the selected dynamic content. Please check server logs or API key configuration.' }, { status: 500 });
     }

    const zipBuffer = await createZipArchive(filesToZip);
    console.log('ZIP archive created.');

    // 6. Return ZIP file
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