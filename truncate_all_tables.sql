-- Xóa toàn bộ dữ liệu trong tất cả các bảng
-- Chạy script này TRƯỚC KHI import neon_backup_fixed.sql

-- Tắt foreign key checks tạm thời
SET session_replication_role = 'replica';

-- Xóa dữ liệu từ các bảng
TRUNCATE TABLE prompts CASCADE;
TRUNCATE TABLE studio CASCADE;
TRUNCATE TABLE tools CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE generations CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE system_config CASCADE;

-- Bật lại foreign key checks
SET session_replication_role = 'origin';

-- Thông báo hoàn thành
SELECT 'All tables truncated successfully!' as status;
