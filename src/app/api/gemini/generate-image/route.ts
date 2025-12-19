import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API Key not configured on server' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { parts, config, model } = body;

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash-image', // Default fallback
            contents: { parts },
            config: config
        });

        // Serialization: The response object might contain methods or non-serializable data.
        // We usually just need the candidates and text.
        // We return the raw response object if possible, or a structured subset.
        // GoogleGenAI response is usually a plain object with candidates, but let's be safe.

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("Server-side Gemini generation error:", error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
