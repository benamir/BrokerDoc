
/**
 * A TypeScript wrapper for the Nebius OpenAI-compatible API.
 * This client provides typed methods for interacting with the Nebius API,
 * focusing on chat completions, including multi-modal (vision) capabilities.
 *
 * @example
 * import { NebiusClient } from './nebius';
 *
 * const nebius = new NebiusClient({
 *   apiKey: process.env.NEBIUS_API_KEY,
 * });
 *
 * async function main() {
 *   // Example 1: Text-only completion
 *   const textCompletion = await nebius.chat.completions.create({
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [
 *       { role: 'system', content: 'You are a helpful assistant.' },
 *       { role: 'user', content: 'What is the capital of France?' },
 *     ],
 *     max_tokens: 50,
 *   });
 *   console.log('Text response:', textCompletion.choices[0].message.content);
 *
 *   // Example 2: Vision (multi-modal) completion
 *   const visionCompletion = await nebius.chat.completions.create({
 *      model: 'some-vision-compatible-model', // Replace with a valid Nebius vision model
 *      messages: [
 *        {
 *          role: 'user',
 *          content: [
 *            { type: 'text', text: 'What is in this image?' },
 *            {
 *              type: 'image_url',
 *              image_url: {
 *                url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // or a public https:// URL
 *              },
 *            },
 *          ],
 *        },
 *      ],
 *      max_tokens: 100,
 *   });
 *   console.log('Vision response:', visionCompletion.choices[0].message.content);
 * }
 *
 * main();
 */

// --- Type Definitions based on the OpenAPI Schema ---

export interface NebiusClientOptions {
  apiKey: string;
  baseURL?: string;
}

// Content parts for multi-modal messages
export interface NebiusContentPartText {
  type: 'text';
  text: string;
}

export interface NebiusContentPartImage {
  type: 'image_url';
  image_url: {
    url: string; // Can be a public URL or a base64 encoded data URI
    detail?: 'auto' | 'low' | 'high';
  };
}

export type NebiusContentPart = NebiusContentPartText | NebiusContentPartImage;

// Message structure
export interface NebiusChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | NebiusContentPart[];
  name?: string;
  tool_calls?: any[]; // Define more strictly if tool usage is needed
  tool_call_id?: string;
}

// Request body for the /v1/chat/completions endpoint
export interface NebiusChatCompletionRequest {
  model: string;
  messages: NebiusChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  response_format?: { type: 'text' | 'json_object' };
  // Add other parameters from the schema as needed
}

// Response structure for non-streaming chat completions
export interface NebiusChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: any[];
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * A client for interacting with the Nebius OpenAI-compatible API.
 */
export class NebiusClient {
  private apiKey: string;
  private baseURL: string;

  constructor(options: NebiusClientOptions) {
    if (!options.apiKey) {
      throw new Error('Nebius API key is required.');
    }
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://llm.api.cloud.yandex.net/v1';
  }

  /**
   * Handles chat completions.
   */
  public chat = {
    completions: {
      /**
       * Creates a model response for the given chat conversation.
       * @param body The request body, including the model and messages.
       * @returns A promise that resolves to the chat completion response.
       */
      create: async (
        body: NebiusChatCompletionRequest
      ): Promise<NebiusChatCompletionResponse> => {
        const url = `${this.baseURL}/chat/completions`;

        // Ensure streaming is not enabled for this simple promise-based method
        if (body.stream) {
          throw new Error(
            "Streaming is not supported by this method. Please use a dedicated streaming method."
          );
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          await this.handleError(response);
        }

        return response.json() as Promise<NebiusChatCompletionResponse>;
      },
    },
  };

  private async handleError(response: Response) {
    const errorBody = await response.text();
    let errorJson: any;
    try {
      errorJson = JSON.parse(errorBody);
    } catch (e) {
      // Not a JSON error, throw with the raw text
      throw new Error(
        `Nebius API Error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }
    
    const errorMessage = errorJson.error?.message || JSON.stringify(errorJson.detail) || 'Unknown error';
    throw new Error(`Nebius API Error: ${response.status} - ${errorMessage}`);
  }
}
