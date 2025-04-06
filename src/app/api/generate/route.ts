import { NextResponse } from 'next/server';
import { ProjectInputState, FileData, GenerationOptions } from '@/types';
import { readTemplateFile, createZipArchive } from '@/lib/files';
import { generateContent } from '@/lib/ai';
import { constructProjectRulesPrompt, constructSpecPrompt, constructChecklistPrompt } from '@/lib/prompts';

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
  let requestBody: Omit<ProjectInputState, 'isLoading' | 'error' | 'apiKey'>;
  try {
    requestBody = await request.json();
    console.log('Request body parsed:', requestBody);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.error('AI_API_KEY environment variable is not set.');
    return NextResponse.json({ error: 'Server configuration error: AI API key missing.' }, { status: 500 });
  }

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

    // 2. Prepare and queue AI generation tasks
    console.log('Preparing AI generation tasks...');
    const generatedContent: { [key: string]: string } = {}; // Store results

    // Generate Project Rules if selected
    if (requestBody.generationOptions.rules) {
        generationPromises.push((async () => {
            try {
                const prompt = constructProjectRulesPrompt(requestBody);
                generatedContent['projectRules'] = await generateContent(prompt, apiKey);
                filesToZip.push({ path: '.cursor/rules/project-specific-rules.mdc', content: generatedContent['projectRules'] });
                console.log('Project-specific rules generated.');
            } catch (err) {
                console.error('Failed to generate project rules:', err);
                // Optionally collect errors to report later
            }
        })());
    }

    // Generate Specs if selected
    for (const specType in requestBody.generationOptions.specs) {
        const key = specType as keyof GenerationOptions['specs'];
        if (requestBody.generationOptions.specs[key]) {
            generationPromises.push((async () => {
                try {
                    const prompt = constructSpecPrompt(key, requestBody);
                    generatedContent[key] = await generateContent(prompt, apiKey);
                    // Determine file path based on key
                    let filePath = 'docs/';
                    if (key === 'prd') filePath += 'prd.md';
                    else if (key === 'tps') filePath += 'tps.md';
                    else if (key === 'uiUx') filePath += 'ui-ux-spec.md';
                    else if (key === 'technical') filePath += 'technical-spec.md';
                    else if (key === 'data') filePath += 'data-spec.md';
                    else if (key === 'integration') filePath += 'integration-spec.md';
                    else return; // Skip if key is somehow invalid

                    filesToZip.push({ path: filePath, content: generatedContent[key] });
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
                const prompt = constructChecklistPrompt(requestBody);
                generatedContent['checklist'] = await generateContent(prompt, apiKey);
                filesToZip.push({ path: 'checklist.md', content: generatedContent['checklist'] });
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
    // TODO: Check for and potentially report partial failures from generationPromises

    // 4. Create ZIP archive (filesToZip is now populated)
    console.log('Creating ZIP archive...');
    if (filesToZip.length === STATIC_RULES.length && generationPromises.length > 0) {
        // Only static files were added, likely due to generation errors or nothing selected
        // Consider throwing an error or returning a specific message if needed
        console.warn("No dynamic content was successfully generated or selected.");
        // If no dynamic content was requested, this is fine.
        let requestedDynamic = requestBody.generationOptions.rules || requestBody.generationOptions.checklist || Object.values(requestBody.generationOptions.specs).some(v => v);
        if (requestedDynamic) {
             return NextResponse.json({ error: 'Failed to generate the selected dynamic content. Please check server logs.' }, { status: 500 });
        }
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
    // Avoid sending potentially sensitive details like API errors to the client
    let clientErrorMessage = 'Failed to generate starter kit. An internal error occurred.';
    if (errorMessage.includes("AI API call failed")) {
        clientErrorMessage = "Failed to generate content using the provided AI API key. Please verify your key and API endpoint configuration.";
    }
    return NextResponse.json({ error: clientErrorMessage }, { status: 500 });
  }
} 