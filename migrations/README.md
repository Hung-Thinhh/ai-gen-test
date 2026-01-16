# Database Migration Guide

## Thứ tự chạy migrations

### 1. Tạo Unified Studios System
```bash
# Chạy migration chính để tạo tables
psql -U your_username -d your_database -f migrations/001-create-unified-studios.sql
```

Hoặc nếu dùng connection string:
```bash
psql "postgresql://user:password@host:port/database" -f migrations/001-create-unified-studios.sql
```

**Tables được tạo:**
- ✅ `tool_types` - Registry của các loại tools
- ✅ `cate_tool_custom` - Categories dùng chung
- ✅ `tool_custom` - Bảng chính chứa tất cả studios
- ✅ `prompt_templates` - Templates có thể tái sử dụng

### 2. Seed Milk Tea Poster Studio
```bash
# Sau khi tạo tables, seed data cho Milk Tea tool
psql -U your_username -d your_database -f migrations/seed-milk-tea-studio.sql
```

**Data được thêm:**
- 1 studio record cho "Thiết Kế Poster Trà Sữa"
- 5 background styles
- 5 decorative elements
- 4 lighting styles
- 4 aspect ratios
- 3 example prompt templates

---

## Verify Migration

Sau khi chạy migrations, verify bằng các queries:

```sql
-- Check tool types
SELECT * FROM tool_types;

-- Check categories
SELECT * FROM cate_tool_custom;

-- Check studios
SELECT id, name, slug, tool_type_id, category_id, status 
FROM tool_custom;

-- Check prompts structure
SELECT name, prompts->'background_styles' as backgrounds
FROM tool_custom 
WHERE slug = 'milk-tea-poster';

-- Count records
SELECT 
  (SELECT COUNT(*) FROM tool_types) as tool_types_count,
  (SELECT COUNT(*) FROM cate_tool_custom) as categories_count,
  (SELECT COUNT(*) FROM tool_custom) as studios_count,
  (SELECT COUNT(*) FROM prompt_templates) as templates_count;
```

Expected results:
- tool_types: 4 rows
- cate_tool_custom: 7 rows
- tool_custom: 1 row (milk-tea-poster)
- prompt_templates: 3 rows

---

## Rollback (nếu cần)

```sql
-- Drop all tables (CAREFUL!)
DROP TABLE IF EXISTS prompt_templates CASCADE;
DROP TABLE IF EXISTS tool_custom CASCADE;
DROP TABLE IF EXISTS cate_tool_custom CASCADE;
DROP TABLE IF EXISTS tool_types CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

---

## Next Steps

Sau khi migration thành công:

1. ✅ Import `MilkTeaPosterGenerator` component vào routing
2. ✅ Fetch studio data từ API
3. ✅ Test generation workflow
4. ✅ Thu thập user feedback

---

## Troubleshooting

### Error: "relation already exists"
→ Tables đã tồn tại. Dùng `DROP TABLE` hoặc skip migration.

### Error: "permission denied"
→ User không có quyền CREATE TABLE. Cần superuser hoặc owner permissions.

### Error: "database does not exist"
→ Tạo database trước: `CREATE DATABASE your_database;`

### JSONB errors
→ Đảm bảo PostgreSQL version >= 9.4 (JSONB support)
