import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { AIProvider } from "./store"; // Import AIProvider type

// Helper function to select the LLM based on SELECTED provider
function getLlm(selectedProvider: AIProvider): {
    llm: BaseChatModel;
    providerName: string;
    modelName: string;
} {
    const temperature = 0.7; // Common setting

    switch (selectedProvider) {
        case 'anthropic': {
            const apiKey = process.env.ANTHROPIC_API_KEY;
            if (!apiKey) throw new Error(`AI Configuration Error: ANTHROPIC_API_KEY is missing in .env.local for selected provider '${selectedProvider}'.`);
            const modelName = process.env.CLAUDE_MODEL_NAME || "claude-3-sonnet-20240229";
            console.log(`Using Anthropic provider with model ${modelName}`);
            return {
                llm: new ChatAnthropic({ apiKey: apiKey, modelName: modelName, temperature: temperature }),
                providerName: "Anthropic",
                modelName: modelName
            };
        }
        case 'google': {
            const apiKey = process.env.GOOGLE_API_KEY;
            if (!apiKey) throw new Error(`AI Configuration Error: GOOGLE_API_KEY is missing in .env.local for selected provider '${selectedProvider}'.`);
            const modelName = process.env.GEMINI_MODEL_NAME || "gemini-pro";
            console.log(`Using Google provider with model ${modelName}`);
            return {
                llm: new ChatGoogleGenerativeAI({ apiKey: apiKey, model: modelName, temperature: temperature }),
                providerName: "Google",
                modelName: modelName
            };
        }
        case 'openai': {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error(`AI Configuration Error: OPENAI_API_KEY is missing in .env.local for selected provider '${selectedProvider}'.`);
            const modelName = process.env.OPENAI_MODEL_NAME || "gpt-3.5-turbo";
            const baseURL = process.env.OPENAI_API_BASE;
            console.log(`Using OpenAI provider with model ${modelName}${baseURL ? ` at ${baseURL}` : ''}`);
            return {
                llm: new ChatOpenAI({ apiKey: apiKey, modelName: modelName, temperature: temperature, configuration: baseURL ? { baseURL } : undefined }),
                providerName: "OpenAI",
                modelName: modelName
            };
        }
        default: {
            // Should not happen due to previous validation, but safeguard anyway
            throw new Error(`AI Configuration Error: Unsupported AI provider selected: ${selectedProvider}.`);
        }
    }
}

/**
 * Calls the AI provider selected by the user via LangChain.
 * Retrieves the correct API key based on the selected provider.
 *
 * @param selectedProvider The AI provider selected in the UI.
 * @param promptTemplateString The template string with placeholders.
 * @param inputVariables An object containing values for the placeholders.
 * @param taskIdentifier Optional identifier for logging
 * @returns The generated text content.
 * @throws Throws an error if configuration is missing, API call fails, or returns an error.
 */
export async function generateContentLangChain(
    selectedProvider: AIProvider,
    promptTemplateString: string,
    inputVariables: Record<string, any>,
    taskIdentifier?: string // Optional identifier for logging
): Promise<string> {
    let llm: BaseChatModel;
    let providerName: string;
    let modelName: string;

    const logPrefix = taskIdentifier ? `[${taskIdentifier}] ` : "";

    try {
        // Pass the selected provider to get the correct LLM instance and key
        ({ llm, providerName, modelName } = getLlm(selectedProvider));
    } catch (configError) {
        console.error(`${logPrefix}LLM Configuration Error:`, configError);
        if (configError instanceof Error) {
           // Pass config error message directly
           throw configError;
        }
         throw new Error(`${logPrefix}Unknown AI Configuration Error.`);
    }

    console.log(`${logPrefix}Invoking ${providerName} model ${modelName} via LangChain...`);

    try {
        const prompt = PromptTemplate.fromTemplate(promptTemplateString);
        const outputParser = new StringOutputParser();
        const chain = prompt.pipe(llm).pipe(outputParser);
        const result = await chain.invoke(inputVariables);

        if (result === undefined || result === null) {
            throw new Error(`${logPrefix}AI generation failed: No content received from the chain.`);
        }
        console.log(`${logPrefix}LangChain generation successful using ${providerName}.`);
        return result.trim();

    } catch (error) {
        console.error(`${logPrefix}Error calling LangChain ${providerName}:`, error);
        if (error instanceof Error) {
            if (error.message.includes("Incorrect API key") || error.message.includes("API key invalid")) {
                 throw new Error(`${logPrefix}AI API call failed: Incorrect API Key provided for ${providerName}.`);
            } else if (error.message.includes("quota")) {
                 throw new Error(`${logPrefix}AI API call failed: API Quota exceeded for ${providerName}.`);
            }
            throw new Error(`${logPrefix}AI API call failed via LangChain (${providerName}): ${error.message}`);
        }
        throw new Error(`${logPrefix}An unknown error occurred while calling the ${providerName} AI API via LangChain.`);
    }
}

/**
 * Calls a generic AI API endpoint to generate content based on a prompt.
 * Assumes an OpenAI-compatible API structure for now.
 *
 * @param prompt The prompt to send to the AI.
 * @param apiKey The API key for authentication.
 * @returns The generated text content.
 * @throws Throws an error if the API call fails or returns an error.
 */
export async function generateContent(prompt: string, apiKey: string): Promise<string> {
    // Basic configuration - Can be made more flexible later (e.g., model selection, provider choice)
    const apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions'; // Default to OpenAI compatible
    const model = process.env.AI_MODEL || 'gpt-3.5-turbo'; // Default model

    console.log(`Sending prompt to AI model ${model} at ${apiEndpoint}...`);

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                // Add other parameters like temperature, max_tokens if needed
                // temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`AI API Error Response (${response.status}):`, errorBody);
            throw new Error(`AI API request failed with status ${response.status}: ${response.statusText}. Body: ${errorBody}`);
        }

        const data = await response.json();

        // Extract content based on typical OpenAI structure
        const content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            console.error('AI API response did not contain expected content:', data);
            throw new Error('AI generation failed: Invalid response structure from API.');
        }

        console.log('AI content generated successfully.');
        return content;

    } catch (error) {
        console.error('Error calling AI API:', error);
        if (error instanceof Error) {
            throw new Error(`AI API call failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred while calling the AI API.');
    }
} 