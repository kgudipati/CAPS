import { NextResponse } from 'next/server';
import { z } from 'zod'; // Need Zod here again for the enum
import { FileData, GenerationOptions, projectInputSchema as baseSchema } from '@/types'; // Removed unused BaseProjectInputData
import { AIProvider, GenerationStatusMap } from '@/lib/store'; // Import AIProvider type and Status types
import { readTemplateFile, createZipArchive } from '@/lib/files';
import { generateContentLangChain, getLlm } from '@/lib/ai';
import {
    formatTechStack,
    projectRulesTemplate,
    getProjectRulesInput,
    specTemplate,
    getSpecInput,
    checklistTemplate,
    getChecklistInput,
    ProjectBaseInput, // Import base input type
    SpecInput, // Import spec input type
} from '@/lib/prompts';
import { BaseChatModel } from '@langchain/core/language_models/chat_models'; // Import BaseChatModel
import pLimit from 'p-limit'; // Import p-limit
import NodeCache from 'node-cache'; // Import node-cache
import crypto from 'crypto'; // Import crypto for hashing

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

// --- Define Task Types ---
interface GenerationTaskBase {
    key: keyof GenerationStatusMap;
    filePath: string;
}

interface RulesTask extends GenerationTaskBase {
    type: 'rules';
    template: string;
    getInputVars: (inputs: ApiInputData, techStackInfo: string) => ProjectBaseInput;
}

interface SpecTask extends GenerationTaskBase {
    type: 'spec';
    specType: keyof GenerationOptions['specs'];
    template: string;
    getInputVars: (specType: keyof GenerationOptions['specs'], inputs: ApiInputData, techStackInfo: string) => SpecInput;
}

interface ChecklistTask extends GenerationTaskBase {
    type: 'checklist';
    template: string;
    getInputVars: (inputs: ApiInputData, techStackInfo: string) => ProjectBaseInput;
}

type GenerationTask = RulesTask | SpecTask | ChecklistTask;

// --- CONCURRENCY LIMIT --- 
const CONCURRENCY = 3; // Limit to 3 simultaneous AI calls

// --- Define which tasks might use a simpler model ---
const SIMPLE_MODEL_TASK_TYPES: GenerationTask['type'][] = ['rules', 'checklist'];

// --- Initialize Cache ---
const aiCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// --- Helper to create cache key ---
function createCacheKey(provider: string, model: string, template: string, inputs: object): string {
    const inputString = JSON.stringify(inputs);
    const hash = crypto.createHash('sha256').update(inputString).digest('hex');
    return `${provider}:${model}:${template.substring(0, 50)}:${hash}`;
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

  // --- LLM Instantiation --- 
  let primaryLlm: BaseChatModel;
  let primaryProviderName: string;
  let primaryModelName: string;
  let simpleLlm: BaseChatModel | null = null;
  let simpleProviderName: string | null = null;
  let simpleModelName: string | null = null;

  try {
    // --- Instantiate Primary LLM ONCE ---
    try {
        ({ llm: primaryLlm, providerName: primaryProviderName, modelName: primaryModelName } = getLlm(requestBody.selectedAIProvider));
    } catch (configError) {
        console.error("Primary LLM Configuration Error:", configError);
        if (configError instanceof Error) throw configError; // Re-throw
        throw new Error("Unknown AI Configuration Error for Primary LLM.");
    }

    // --- Try to Instantiate Optional Simple LLM ---
    try {
        // Attempt to get config using _SIMPLE suffix
        const simpleConfig = getLlm(requestBody.selectedAIProvider, '_SIMPLE');
        // Only use it if the model name is actually different from the primary
        if (simpleConfig.modelName !== primaryModelName) {
            simpleLlm = simpleConfig.llm;
            simpleProviderName = simpleConfig.providerName;
            simpleModelName = simpleConfig.modelName;
            console.log(`Successfully configured secondary simple model: ${simpleProviderName} - ${simpleModelName}`);
        } else {
            console.log('Simple model configuration is the same as primary or not found, using primary for all tasks.');
        }
    } catch (configError) {
        // It's okay if the simple model config is missing/errors, just log and fallback to primary
        console.warn("Optional Simple LLM Configuration failed (will use primary for all tasks):", configError instanceof Error ? configError.message : configError);
    }

    // --- Prepare Common Inputs ONCE --- 
    const techStackInfo = formatTechStack(requestBody.techStack);

    const filesToZip: FileData[] = [];
    const generationTasksToRun: GenerationTask[] = []; // Define specific tasks

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

    // 2. Define AI generation tasks based on selections
    console.log('Defining AI generation tasks...');

    if (requestBody.generationOptions.rules) {
        generationTasksToRun.push({
            key: 'rules',
            type: 'rules',
            filePath: '.cursor/rules/project-specific-rules.mdc',
            template: projectRulesTemplate,
            getInputVars: getProjectRulesInput,
        });
    }

    for (const specType in requestBody.generationOptions.specs) {
        const key = specType as keyof GenerationOptions['specs'];
        if (requestBody.generationOptions.specs[key]) {
            const filePath = getSpecFilePath(key);
            if (filePath) {
                generationTasksToRun.push({
                    key: key as keyof GenerationStatusMap, // Ensure key matches status map
                    type: 'spec',
                    specType: key,
                    filePath: filePath,
                    template: specTemplate,
                    getInputVars: getSpecInput,
                });
            }
        }
    }

    if (requestBody.generationOptions.checklist) {
        generationTasksToRun.push({
            key: 'checklist',
            type: 'checklist',
            filePath: 'checklist.md',
            template: checklistTemplate,
            getInputVars: getChecklistInput,
        });
    }

    // 3. Execute tasks with concurrency limit AND CACHING
    const limit = pLimit(CONCURRENCY);
    console.log(`Executing ${generationTasksToRun.length} AI tasks (concurrency: ${CONCURRENCY}, cache enabled)...`);

    const taskPromises = generationTasksToRun.map((task) => {
        // Determine LLM selection and prepare inputs *before* cache check/limit
        let useLlm: BaseChatModel;
        let useProviderName: string;
        let useModelName: string;
        if (simpleLlm && simpleProviderName && simpleModelName && SIMPLE_MODEL_TASK_TYPES.includes(task.type)) {
            useLlm = simpleLlm;
            useProviderName = simpleProviderName;
            useModelName = simpleModelName;
        } else {
            useLlm = primaryLlm;
            useProviderName = primaryProviderName;
            useModelName = primaryModelName;
        }

        let inputVariables: ProjectBaseInput | SpecInput;
        if (task.type === 'spec') {
            inputVariables = task.getInputVars(task.specType, requestBody, techStackInfo);
        } else {
            inputVariables = task.getInputVars(requestBody, techStackInfo);
        }

        // --- CACHE CHECK --- 
        const cacheKey = createCacheKey(useProviderName, useModelName, task.template, inputVariables);
        const cachedResult = aiCache.get<FileData>(cacheKey);

        if (cachedResult) {
            console.log(`Cache HIT for task ${task.key}`);
            // Return a resolved promise directly if cache hit, matching the expected return type
            return Promise.resolve({ key: task.key, fileData: cachedResult, error: undefined });
        }
        // --- END CACHE CHECK --- 

        // If cache miss, wrap the AI call in the limiter
        console.log(`Cache MISS for task ${task.key}, queueing AI call...`);
        return limit(async (): Promise<{ key: keyof GenerationStatusMap; fileData: FileData | null; error?: any }> => {
            try {
                // Inputs already prepared outside
                const content = await generateContentLangChain(
                    useLlm,
                    useProviderName,
                    useModelName,
                    task.template,
                    inputVariables
                );

                let finalContent = content;
                if (task.type === 'spec') {
                    const match = content.match(/--- BEGIN .*? ---\n?([\s\S]*?)\n?--- END .*? ---/);
                    finalContent = match ? match[1].trim() : content;
                }

                const resultData: FileData = { path: task.filePath, content: finalContent };

                // --- CACHE SET --- 
                aiCache.set(cacheKey, resultData);
                console.log(`Task ${task.key} generated successfully using ${useModelName} (and cached).`);
                // --- END CACHE SET --- 

                return { key: task.key, fileData: resultData };
            } catch (err) {
                console.error(`Failed to generate ${task.key}:`, err);
                return { key: task.key, fileData: null, error: err };
            }
        });
    });

    // Wait for all promises (cached or limited) to settle
    const settledResults = await Promise.allSettled(taskPromises);
    console.log('All generation tasks settled.');

    // 4. Process results and build status map
    const generationResults: Partial<GenerationStatusMap> = {};
    settledResults.forEach((result) => {
        if (result.status === 'fulfilled') {
            const { key, fileData, error } = result.value;
            if (fileData && !error) {
                filesToZip.push(fileData);
                generationResults[key] = 'success';
            } else {
                // Task completed but returned an error object or null fileData
                generationResults[key] = 'error';
            }
        } else {
            // Promise rejected (should ideally be caught within the limited function, but handle defensively)
            console.error(`Task promise rejected:`, result.reason);
            // We don't know which 'key' this belongs to easily if the promise itself rejects
            // This case is less likely if errors are handled within the limit wrapper
        }
    });
    // Ensure all requested tasks have a status (mark unfulfilled/rejected ones as error)
    generationTasksToRun.forEach(task => {
        if (!(task.key in generationResults)) {
            generationResults[task.key] = 'error';
            console.error(`Task for ${task.key} did not produce a result.`);
        }
    });

    // 5. Create ZIP archive
    console.log('Creating ZIP archive...');
    const requestedDynamicCount = generationTasksToRun.length;
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
    let clientErrorMessage = `Generation failed: ${errorMessage}`;
    if (errorMessage.includes("AI Configuration Error")) {
      clientErrorMessage = errorMessage; // Pass specific config errors to client
    }
    return NextResponse.json({ error: clientErrorMessage }, { status: 500 });
  }
} 