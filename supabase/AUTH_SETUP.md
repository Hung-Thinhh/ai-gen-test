# 🔐 Supabase Auth Setup Guide

## Bước 1: Enable Google OAuth Provider

1. **Vào:** Supabase Dashboard → Authentication → Providers
2. **Tìm:** Google
3. **Click:** Enable
4. **Lấy callback URL:** Copy "Callback URL (for OAuth)" 
   - Sẽ giống: `https://xxxxx.supabase.co/auth/v1/callback`

---

## Bước 2: Tạo Google OAuth App

### 2.1. Vào Google Cloud Console
**URL:** https://console.cloud.google.com/apis/credentials

### 2.2. Create OAuth Client ID
1. **Click:** "Create Credentials" → "OAuth client ID"
2. **Application type:** Web application
3. **Name:** "Duky AI - Supabase Auth"

4. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://your-domain.com
   ```

5. **Authorized redirect URIs:**
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
   ⚠️ Paste callback URL từ Supabase (Bước 1)

6. **Click:** Create

### 2.3. Copy Credentials
Sau khi tạo, bạn sẽ nhận được:
- **Client ID**: `xxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxx`

---

## Bước 3: Configure Supabase

1. **Quay lại:** Supabase → Authentication → Providers → Google
2. **Paste:**
   - **Client ID (for OAuth)**: Paste Client ID từ Google
   - **Client Secret (for OAuth)**: Paste Client Secret
3. **Click:** Save

---

## Bước 4: Test Auth Flow

### 4.1. Start Dev Server
```bash
npm run dev
```

### 4.2. Test Login
1. Mở http://localhost:3000
2. Click "Đăng nhập với Google"
3. Chọn Google account
4. Redirect về app → Check console log

### 4.3. Verify in Database
Chạy query trong Supabase SQL Editor:
```sql
SELECT user_id, email, current_credits, created_at 
FROM users 
WHERE user_type = 'registered'
ORDER BY created_at DESC
LIMIT 5;
```

Bạn sẽ thấy user mới với 20 credits!

---

## ✅ Checklist

- [ ] Google OAuth app created
- [ ] Redirect URIs configured
- [ ] Client ID/Secret added to Supabase
- [ ] Test login successful
- [ ] User created in database with credits

---

## 🐛 Troubleshooting

**Error: "redirect_uri_mismatch"**
- Check redirect URI trong Google Console khớp với Supabase callback URL

**User không tạo trong DB:**
- Check browser console logs
- Verify RLS policies cho users table
- Check Supabase logs: Dashboard → Logs

**401 Unauthorized:**
- Verify NEXT_PUBLIC_SUPABASE_URL và ANON_KEY trong `.env.local`
- Restart dev server after changing .env
