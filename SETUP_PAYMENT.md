# Hướng Dẫn Setup SePay Payment - Từng Bước

## Bước 1: Setup Database

### 1.1. Mở Supabase Dashboard

1. Đi tới: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)

### 1.2. Run Migration

1. Click **New query**
2. Copy toàn bộ nội dung từ file: `database/migrations/create_payment_transactions.sql`
3. Paste vào SQL Editor
4. Click **Run** (hoặc Ctrl/Cmd + Enter)

**Kết quả mong đợi:**
```
Success. No rows returned
```

### 1.3. Verify Table Created

Chạy query sau để kiểm tra:

```sql
SELECT * FROM payment_transactions LIMIT 1;
```

Nếu không có lỗi → Table đã được tạo thành công! ✅

---

## Bước 2: Lấy Supabase Service Role Key

### 2.1. Trong Supabase Dashboard

1. Vào **Settings** → **API**
2. Tìm section **Project API keys**
3. Copy `service_role` key (⚠️ KHÔNG phải anon key)

**Lưu ý:** Service role key rất quan trọng, không share hoặc commit lên Git!

---

## Bước 3: Lấy SePay API Token (Tùy chọn ngay bây giờ)

### 3.1. Đăng ký và lấy API Token

1. Truy cập: https://my.sepay.vn/
2. Đăng ký tài khoản (nếu chưa có)
3. Đăng nhập vào dashboard
4. Vào menu **Cài đặt** (Settings) → **API Key**
5. Click **Tạo Token Mới** hoặc **Create New Token**
6. Đặt tên cho token (ví dụ: "Duky AI Production")
7. Copy **API Token** được tạo ra

**LƯU Ý:** 
- API Token chỉ hiển thị 1 lần, hãy lưu lại ngay!
- **KHÔNG CẦN Merchant ID** - SePay không sử dụng field này
- Secret Key cho webhook là optional, bạn có thể config sau

### 3.2. Optional: Config Webhook Authentication

Nếu muốn verify webhook signature (khuyến nghị cho production):

1. Khi tạo webhook (như ảnh bạn gửi), chọn authentication method
2. Nếu chọn "Đúng" cho "Là WebHooks xác thực thanh toán", SePay sẽ gửi signature
3. Lưu secret key được cấp (nếu có) vào `SEPAY_SECRET_KEY`

**Để test UI trước:** Bạn có thể skip bước này và dùng mock payment URL!

---

## Bước 4: Setup Environment Variables

### 4.1. Tạo file `.env.local`

Trong thư mục gốc project (`d:\test\tesst_img_ai\my-app`), tạo file `.env.local`:

```bash
# Supabase Service Role Key (REQUIRED)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_2

# SePay API Token (Optional cho test UI)
SEPAY_API_KEY=your_sepay_api_token_from_step_3

# Secret key để verify webhook (Optional)
SEPAY_SECRET_KEY=your_webhook_secret_if_configured

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2. Replace Values

Thay thế các placeholder:
- `your_service_role_key_from_step_2` → Service role key từ Bước 2 ✅ **BẮT BUỘC**
- `your_sepay_api_token_from_step_3` → API Token từ SePay (hoặc để trống để dùng mock)
- `your_webhook_secret_if_configured` → Secret để verify webhook (tùy chọn)

**Lưu ý:** Nếu bỏ trống `SEPAY_API_KEY`, app sẽ dùng mock payment URL để test UI!

---

## Bước 5: Restart Dev Server

### 5.1. Stop Server

Nếu server đang chạy, stop nó (Ctrl+C trong terminal)

### 5.2. Start Lại

```bash
npm run dev
```

Server sẽ load env variables mới.

---

## Bước 6: Test Payment Flow

### 6.1. Mở Browser

Truy cập: http://localhost:3000

### 6.2. Đăng Nhập

Đăng nhập với Google account

### 6.3. Navigate to Pricing

- Scroll xuống trang chủ
- Hoặc vào menu Pricing/Bảng giá

### 6.4. Test "Mua Ngay"

Click button **Mua ngay** trên gói Starter (hoặc bất kỳ gói paid nào)

**Kết quả mong đợi:**

1. ✅ Toast hiển thị: "Đang chuyển đến trang thanh toán..."
2. ✅ Redirect đến URL mock (hoặc SePay nếu đã config)
3. ✅ Check console logs:
   ```
   [Payment] Creating payment for package: starter
   [Payment] Payment URL: https://sandbox.sepay.vn/...
   ```

### 6.5. Check Database

Trong Supabase SQL Editor, run:

```sql
SELECT * FROM payment_transactions 
ORDER BY created_at DESC 
LIMIT 5;
```

**Kết quả mong đợi:**
- ✅ Có 1 record mới
- ✅ `status` = 'pending'
- ✅ `order_id` có format: `DUKY_timestamp_userid`
- ✅ `credits` và `amount` đúng với gói đã chọn

---

## Bước 7: Test Webhook (Advanced - Cần ngrok)

⚠️ **Skip bước này nếu chưa có SePay account**

### 7.1. Install ngrok

```bash
# Download từ: https://ngrok.com/download
# Hoặc dùng npm:
npm install -g ngrok
```

### 7.2. Expose Local Server

```bash
ngrok http 3000
```

Copy HTTPS URL (vd: `https://abc123.ngrok.io`)

### 7.3. Update .env.local

```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

Restart dev server.

### 7.4. Configure SePay Webhook

1. Vào SePay Dashboard → Webhooks
2. Thêm webhook URL: `https://abc123.ngrok.io/api/sepay/webhook`
3. Save

### 7.5. Test Payment with Real SePay

Click "Mua ngay" → Complete payment → Check:
- ✅ Webhook được gọi (check ngrok console hoặc server logs)
- ✅ Credits được cộng vào DB
- ✅ Transaction status = 'completed'
- ✅ Success page hiển thị số credits

---

## Troubleshooting

### Lỗi: "Payment gateway not configured"

**Nguyên nhân:** `SEPAY_API_KEY` chưa có trong `.env.local`

**Giải pháp:** Script đang dùng mock URL. Đây là OK cho test UI. Nếu muốn test thật, thêm SEPAY_API_KEY.

### Lỗi: "Failed to create transaction"

**Nguyên nhân:** `SUPABASE_SERVICE_ROLE_KEY` không đúng hoặc RLS policy chặn.

**Giải pháp:**
1. Check service role key trong `.env.local`
2. Verify migration đã chạy đúng

### Lỗi: "Unauthorized"

**Nguyên nhân:** User chưa đăng nhập.

**Giải pháp:** Đăng nhập lại với Google.

---

## Checklist Hoàn Thành

- [ ] ✅ Database migration đã run
- [ ] ✅ Supabase service role key đã config
- [ ] ✅ .env.local file created
- [ ] ✅ Dev server restarted
- [ ] ✅ Click "Mua ngay" thành công
- [ ] ✅ Transaction record xuất hiện trong DB
- [ ] 🔄 (Optional) SePay account registered
- [ ] 🔄 (Optional) Webhook tested với ngrok

---

## Next Steps

Sau khi test OK trên localhost:

1. **Deploy lên production** (Vercel/Netlify)
2. **Update NEXT_PUBLIC_APP_URL** thành production domain
3. **Configure SePay webhook** với production URL
4. **Test với real payment** (số tiền nhỏ trước)
5. **Monitor logs** sau vài ngày đầu

---

🎉 **Chúc mừng!** Bạn đã tích hợp xong SePay payment gateway!
