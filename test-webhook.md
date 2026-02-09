# Test Webhook SePay

## Vấn đề
Resend webhook từ SePay nhưng không thấy logs trong terminal localhost.

## Nguyên nhân có thể
1. **Webhook URL trên SePay đang trỏ tới production** (`https://dukyai.com/api/sepay/webhook`)
2. Localhost không thể nhận webhook từ internet

## Giải pháp

### Option 1: Test trực tiếp bằng curl (Khuyến nghị)

```powershell
# Test webhook endpoint
curl -X POST http://localhost:3000/api/sepay/webhook `
  -H "Content-Type: application/json" `
  -H "Api-Key: cb45e363265080e7fdf4b019e4a7d715c25714136241d9f9d12d61af8015aefd" `
  -d '{\"gateway\":\"TPBank\",\"transactionDate\":\"2026-02-09 11:34:50\",\"accountNumber\":\"02627122301\",\"subAccount\":\"102\",\"code\":null,\"content\":\"DUKY1770611641435ebf2d43f CHUYEN TIEN\",\"transferType\":\"in\",\"description\":\"Test webhook\",\"transferAmount\":2000,\"referenceCode\":\"TEST123\",\"accumulated\":358841,\"id\":41730758}'
```

### Option 2: Sử dụng ngrok để expose localhost

```powershell
# 1. Cài ngrok: https://ngrok.com/download
# 2. Chạy ngrok
ngrok http 3000

# 3. Copy HTTPS URL (vd: https://abc123.ngrok.io)
# 4. Cập nhật webhook URL trên SePay dashboard:
#    https://abc123.ngrok.io/api/sepay/webhook
```

### Option 3: Update manual trong database

```sql
-- Kiểm tra transaction hiện tại
SELECT * FROM payment_transactions 
WHERE order_id LIKE '%1770611641435%' 
ORDER BY created_at DESC;

-- Update thành completed
UPDATE payment_transactions 
SET 
    status = 'completed',
    transaction_id = 'SEPAY_MANUAL_41730758',
    completed_at = NOW()
WHERE order_id = 'DUKY1770611641435ebf2d43f';

-- Cộng credits cho user
UPDATE users 
SET current_credits = current_credits + 20  -- Adjust credits amount
WHERE user_id = 'ebf2d43f-3065-498b-b9e8-a27e07748b25';
```

## Kiểm tra webhook URL hiện tại

1. Đăng nhập https://my.sepay.vn
2. Vào **Cài đặt** → **Webhook**
3. Kiểm tra URL hiện tại là gì?
   - Nếu là `https://dukyai.com/...` → Webhook đang gọi production
   - Cần dùng ngrok hoặc test bằng curl

## Xác nhận API Key

API Key trong .env.local:
```
cb45e363265080e7fdf4b019e4a7d715c25714136241d9f9d12d61af8015aefd
```

Đây là `SEPAY_WEBHOOK_SECRET`, KHÔNG phải `SEPAY_API_KEY`!

**Cần kiểm tra lại:**
- `SEPAY_API_KEY` (dòng 9): Dùng để GỌI API SePay
- `SEPAY_WEBHOOK_SECRET` (dòng 11): Dùng để NHẬN webhook từ SePay

Có thể bạn đang nhầm lẫn 2 keys này!
