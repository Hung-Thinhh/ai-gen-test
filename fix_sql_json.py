"""
Script để sửa ĐÚNG các dữ liệu JSON trong file neon_backup.sql
CHỈ chuyển description (cột thứ 4) thành JSON, KHÔNG động vào name
"""

import re

# Đọc file
with open('d:/test/tesst_img_ai/my-app/neon_backup.sql', 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed_lines = []

for line in lines:
    # Chỉ xử lý các dòng INSERT INTO tools
    if line.startswith('INSERT INTO tools'):
        # Pattern phức tạp hơn để match đúng thứ tự cột
        # VALUES (tool_id, tool_key, name, description, ...)
        # Tìm description (cột thứ 4) - là string sau name
        
        # Tìm vị trí VALUES
        values_start = line.find('VALUES (')
        if values_start == -1:
            fixed_lines.append(line)
            continue
            
        # Lấy phần VALUES
        values_part = line[values_start + 8:]  # Bỏ "VALUES ("
        
        # Split theo dấu phẩy, nhưng phải cẩn thận với string có dấu phẩy bên trong
        # Cách đơn giản: tìm description bằng regex
        
        # Pattern: sau name (cột 3), tìm description (cột 4)
        # name có thể là: 'string' hoặc '{"json"}'
        # description cũng vậy
        
        # Tìm: , 'description_value', base_credit_cost
        # Chỉ thay thế nếu description KHÔNG phải JSON (không có {)
        pattern = r"(, ')([^'{][^']*)(', \d+, 'gemini)"
        
        def replace_desc(match):
            before = match.group(1)  # ", '"
            desc = match.group(2)     # description text
            after = match.group(3)    # "', số, 'gemini"
            
            # Nếu đã là JSON, bỏ qua
            if '{' in desc:
                return match.group(0)
            
            # Chuyển thành JSON
            json_desc = '{"vi": "' + desc + '"}'
            return before + json_desc + "'::jsonb" + after
        
        fixed_line = re.sub(pattern, replace_desc, line)
        fixed_lines.append(fixed_line)
    else:
        fixed_lines.append(line)

# Ghi lại file
with open('d:/test/tesst_img_ai/my-app/neon_backup_fixed.sql', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("✅ Đã sửa xong! File mới: neon_backup_fixed.sql")
print("Chỉ sửa cột description, KHÔNG động vào name")
