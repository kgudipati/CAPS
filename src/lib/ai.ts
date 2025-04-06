import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

// Helper function to select the LLM based on environment variables
function getLlm(): {
    llm: BaseChatModel;
    providerName: string;
    modelName: string;
} {
    const provider = process.env.AI_PROVIDER?.toLowerCase();
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    const temperature = 0.7; // Common setting

    if (provider === 'anthropic' || (!provider && anthropicApiKey)) {
        if (!anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is required for Anthropic provider.");
        const modelName = process.env.CLAUDE_MODEL_NAME || "claude-3-sonnet-20240229";
        console.log(`Using Anthropic provider with model ${modelName}`);
        return {
            llm: new ChatAnthropic({
                anthropicApiKey: anthropicApiKey,
                modelName: modelName,
                temperature: temperature,
            }),
            providerName: "Anthropic",
            modelName: modelName
        };
    } else if (provider === 'google' || (!provider && googleApiKey)) {
        if (!googleApiKey) throw new Error("GOOGLE_API_KEY is required for Google provider.");
        const modelName = process.env.GEMINI_MODEL_NAME || "gemini-pro";
        console.log(`Using Google provider with model ${modelName}`);
        return {
            llm: new ChatGoogleGenerativeAI({
                apiKey: googleApiKey,
                model: modelName,
                temperature: temperature,
                // safetySettings: [], // Optional: Adjust safety settings if needed
            }),
            providerName: "Google",
            modelName: modelName
        };
    } else if (provider === 'openai' || (!provider && openaiApiKey) || provider === undefined) {
        // Default to OpenAI if explicitly set, key is present, or no provider specified
        if (!openaiApiKey) throw new Error("OPENAI_API_KEY is required for OpenAI provider (or as default). Please set OPENAI_API_KEY, GOOGLE_API_KEY, or ANTHROPIC_API_KEY.");
        const modelName = process.env.OPENAI_MODEL_NAME || "gpt-3.5-turbo";
        const baseURL = process.env.OPENAI_API_BASE; // Support for custom base URL / proxy
        console.log(`Using OpenAI provider with model ${modelName}${baseURL ? ` at ${baseURL}` : ''}`);
        return {
            llm: new ChatOpenAI({
                apiKey: openaiApiKey,
                modelName: modelName,
                temperature: temperature,
                configuration: baseURL ? { baseURL } : undefined,
            }),
            providerName: "OpenAI",
            modelName: modelName
        };
    } else {
        throw new Error(`Unsupported AI_PROVIDER specified: ${provider}. Supported: openai, google, anthropic (or leave unset and provide a valid API key).`);
    }
}

/**
 * Calls the configured AI provider via LangChain to generate content based on a prompt template and input variables.
 *
 * @param promptTemplateString The template string with placeholders.
 * @param inputVariables An object containing values for the placeholders.
 * @returns The generated text content.
 * @throws Throws an error if configuration is missing, API call fails, or returns an error.
 */
export async function generateContentLangChain(promptTemplateString: string, inputVariables: Record<string, any>): Promise<string> {
    let llm: BaseChatModel;
    let providerName: string;
    let modelName: string;

    try {
        ({ llm, providerName, modelName } = getLlm());
    } catch (configError) {
        console.error("LLM Configuration Error:", configError);
        if (configError instanceof Error) {
           throw new Error(`AI Configuration Error: ${configError.message}`);
        }
         throw new Error("Unknown AI Configuration Error.");
    }

    console.log(`Invoking ${providerName} model ${modelName} via LangChain...`);

    try {
        const prompt = PromptTemplate.fromTemplate(promptTemplateString);
        const outputParser = new StringOutputParser();
        const chain = prompt.pipe(llm).pipe(outputParser);
        const result = await chain.invoke(inputVariables);

        if (result === undefined || result === null) {
            throw new Error("AI generation failed: No content received from the chain.");
        }

        console.log(`LangChain generation successful using ${providerName}.`);
        return result.trim();

    } catch (error) {
        console.error(`Error calling LangChain ${providerName}:`, error);
        if (error instanceof Error) {
            // Pass specific errors up
            if (error.message.includes("Incorrect API key") || error.message.includes("API key invalid")) {
                 throw new Error(`AI API call failed: Incorrect API Key provided for ${providerName}.`);
            } else if (error.message.includes("quota")) {
                 throw new Error(`AI API call failed: API Quota exceeded for ${providerName}.`);
            }
            throw new Error(`AI API call failed via LangChain (${providerName}): ${error.message}`);
        }
        throw new Error(`An unknown error occurred while calling the ${providerName} AI API via LangChain.`);
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