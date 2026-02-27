# Cloudflare Workers - Gemini Proxy

Proxy để bypass region restriction (EU -> US) cho FIFA tool

## Deploy Steps

### 1. Cài đặt Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login Cloudflare
```bash
npx wrangler login
```

### 3. Set Gemini API Key (Secret)
```bash
npx wrangler secret put GEMINI_API_KEY
```

### 4. Deploy Worker
```bash
cd workers
npx wrangler deploy
```

Sau khi deploy, bạn sẽ nhận được URL kiểu:
`https://gemini-proxy-duky.your-account.workers.dev`

### 5. Thêm vào Environment Variables

Trong file `.env.local` hoặc trên Vercel/VPS:
```env
NEXT_PUBLIC_GEMINI_PROXY_URL=https://gemini-proxy-duky.your-account.workers.dev
```

## Test
```bash
curl -X POST https://gemini-proxy-duky.your-account.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: https://dukyai.com" \
  -d '{
    "model": "gemini-2.5-flash-image",
    "parts": [{"text": "test"}]
  }'
```

## Lưu ý bảo mật
- Chỉ cho phép origin từ domain của bạn
- API key được lưu trong Cloudflare secret (không expose)
- Có thể thêm rate limiting nếu cần
