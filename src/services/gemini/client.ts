/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI } from "@google/genai";

// Read API key from either GEMINI_API_KEY (preferred) or API_KEY for backwards compatibility
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// If we don't have an API key, expose a safe stub that throws friendly errors when used.
function createStubClient() {
	return {
		models: {
			async generateContent() {
				throw new Error('Gemini API key is not configured. Configure `GEMINI_API_KEY` or `API_KEY` in your environment files (.env).');
			}
		}
	} as unknown as GoogleGenAI;
}

// Create real client if apiKey is present, otherwise use stub to avoid runtime crashes
if (!apiKey) {
	console.warn("Gemini API Key is missing. Using stub client. Please check NEXT_PUBLIC_GEMINI_API_KEY in .env.local");
} else {
	console.log("Gemini Client initialized with API Key.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : createStubClient();

export const hasApiKey = Boolean(apiKey);
export default ai;