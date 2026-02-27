/**
 * Cloudflare Worker - Gemini API Proxy
 * 
 * Mục đích: Bypass region restriction (EU -> US)
 * VPS ở Đức gọi qua worker này (Cloudflare edge) để tránh policy nghiêm ngặt của EU
 * 
 * Deploy: npx wrangler deploy
 */

export default {
  async fetch(request, env, ctx) {
    // Xử lý CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    // Chỉ cho phép POST và từ domain của bạn
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Kiểm tra origin (bảo mật)
    const allowedOrigins = [
      'https://dukyai.com',
      'https://www.dukyai.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    const origin = request.headers.get('Origin');
    if (!allowedOrigins.includes(origin)) {
      console.log('Blocked origin:', origin);
      return new Response('Forbidden - Invalid origin', { status: 403 });
    }

    try {
      // Parse request body từ client
      const body = await request.json();
      const { parts, config, model } = body;

      console.log('[Proxy] Received request:', { model, partsCount: parts?.length });

      // Build Gemini API URL
      const geminiModel = model || 'gemini-2.5-flash-image';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${env.GEMINI_API_KEY}`;

      // Build request cho Gemini
      const geminiBody = {
        contents: [{
          role: 'user',
          parts: parts
        }],
        generationConfig: {
          responseModalities: ["Text", "Image"],
          ...config
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      };

      // Gọi Gemini API
      console.log('[Proxy] Calling Gemini API...');
      const geminiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiBody),
      });

      const responseData = await geminiResponse.json();

      // Kiểm tra lỗi từ Gemini
      if (responseData.error) {
        console.error('[Proxy] Gemini error:', responseData.error);
        return new Response(JSON.stringify(responseData), {
          status: 500,
          headers: corsHeaders(origin)
        });
      }

      console.log('[Proxy] Gemini success, returning...');

      // Trả về response cho client
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('[Proxy] Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Proxy error', 
        message: error.message 
      }), {
        status: 500,
        headers: corsHeaders(origin)
      });
    }
  }
};

// CORS headers
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

// Handle preflight
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}
