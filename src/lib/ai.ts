import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

/**
 * Calls the OpenAI API via LangChain to generate content based on a prompt template and input variables.
 *
 * @param promptTemplateString The template string with placeholders (e.g., "Tell me about {topic}.").
 * @param inputVariables An object containing values for the placeholders in the template.
 * @param apiKey OpenAI API Key.
 * @returns The generated text content.
 * @throws Throws an error if the API call fails or returns an error.
 */
export async function generateContentLangChain(promptTemplateString: string, inputVariables: Record<string, any>, apiKey: string): Promise<string> {
    const model = process.env.AI_MODEL || 'gpt-3.5-turbo'; // Or your preferred model
    const temperature = 0.7; // Adjust as needed

    console.log(`Invoking LangChain OpenAI model ${model}...`);

    try {
        const llm = new ChatOpenAI({
            apiKey: apiKey,
            modelName: model,
            temperature: temperature,
            // You can add other configurations like maxTokens if needed
        });

        // Create a prompt template from the string
        const prompt = PromptTemplate.fromTemplate(promptTemplateString);

        // Define the output parser
        const outputParser = new StringOutputParser();

        // Create the chain
        const chain = prompt.pipe(llm).pipe(outputParser);

        // Invoke the chain with the input variables
        const result = await chain.invoke(inputVariables);

        if (!result) {
            throw new Error("AI generation failed: No content received from the chain.");
        }

        console.log("LangChain generation successful.");
        return result.trim();

    } catch (error) {
        console.error('Error calling LangChain OpenAI:', error);
        if (error instanceof Error) {
            // Try to provide a more specific error if possible
            if (error.message.includes("Incorrect API key")) {
                throw new Error("AI API call failed: Incorrect API Key provided.");
            } else if (error.message.includes("quota")) {
                 throw new Error("AI API call failed: API Quota exceeded.");
            }
            throw new Error(`AI API call failed via LangChain: ${error.message}`);
        }
        throw new Error('An unknown error occurred while calling the AI API via LangChain.');
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