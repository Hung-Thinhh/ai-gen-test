# 📄 HƯỚNG DẪN CHẠY SQL MIGRATIONS

## Bước 1: Vào Supabase SQL Editor

1. **Truy cập:** https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. **Click:** "New Query"

---

## Bước 2: Chạy Migrations Theo Thứ Tự

### ✅ Migration 1: Initial Schema
**File:** `001_initial_schema.sql`

Copy toàn bộ nội dung file và paste vào SQL Editor → **RUN**

Tạo tables: users, tools, generation_history, transactions, packages, user_purchases, system_configs

---

### ✅ Migration 2: RLS Policies  
**File:** `002_rls_policies.sql`

Copy toàn bộ → **RUN**

Setup Row Level Security để protect data

---

### ✅ Migration 3: Seed Data
**File:** `003_seed_data.sql`

Copy toàn bộ → **RUN**

Thêm data mẫu cho tools và packages

---

### ✅ Migration 4: Helper Functions
**File:** `004_helper_functions.sql`

Copy toàn bộ → **RUN**

Tạo các functions: deduct_credits, add_credits, generate_user_id, etc.

---

## Bước 3: Verify Database

Chạy query này để kiểm tra:

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show:
-- generation_history
-- packages
-- system_configs
-- tools
-- transactions
-- user_purchases
-- users
```

```sql
-- Check seed data
SELECT tool_key, display_name->>'vi' as name, base_credit_cost 
FROM tools;

SELECT package_key, display_name->>'vi' as name, price_vnd 
FROM packages;
```

---

## Bước 4: Setup Storage Bucket

1. **Vào:** Storage → Create bucket
2. **Name:** `generated-images`
3. **Public:** ✅ Public bucket (để access images)
4. **Click:** Create bucket

### Thiết lập Storage Policies:

Vào bucket `generated-images` → Policies → New Policy:

**Policy 1: Public Read**
```sql
CREATE POLICY "Public read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');
```

---

## ✅ DONE!

Database đã sẵn sàng. Tiếp theo: Setup Auth providers (Google login)
