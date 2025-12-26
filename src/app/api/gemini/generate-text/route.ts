import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Server API Key not configured' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { contents, model, config } = body;

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            contents,
            config
        });

        // Return the full response structure or just text based on client expectation.
        // The client expects `response.text`.
        return NextResponse.json({
            candidates: response.candidates,
            text: response.text // Helper property often available or derived
        });

    } catch (error: any) {
        console.error("Server-side Gemini text generation error:", error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
