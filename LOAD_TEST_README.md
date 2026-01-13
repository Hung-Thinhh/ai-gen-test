# Load Testing Guide

## Cách test nhiều người truy cập đồng thời

### 🎯 Option 1: Artillery (Recommend - Professional)

**Install:**
```bash
npm install -g artillery
```

**Run test:**
```bash
# Quick test
artillery quick --count 10 --num 20 http://localhost:3000

# Với config file (detailed)
artillery run load-test.yml

# Generate HTML report
artillery run --output report.json load-test.yml
artillery report report.json
```

**Giải thích:**
- `--count 10`: 10 virtual users
- `--num 20`: Mỗi user làm 20 requests
- Config file cho phép custom scenarios chi tiết hơn

---

### 🎯 Option 2: Node.js Script (Simple)

**Run:**
```bash
node scripts/concurrent-users-test.js
```

**Customize trong file:**
```javascript
const NUM_USERS = 10;          // Số người dùng đồng thời
const ACTIONS_PER_USER = 5;    // Số action mỗi user
```

---

### 🎯 Option 3: K6 (Advanced)

**Install:**
```bash
# Windows (chocolatey)
choco install k6

# Or download from k6.io
```

**Create test script (test.js):**
```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
};

export default function () {
  http.get('http://localhost:3000');
  http.get('http://localhost:3000/tool');
  sleep(1);
}
```

**Run:**
```bash
k6 run test.js
```

---

### 🎯 Option 4: Manual Testing (Quick & Simple)

**Cách 1 - Multiple Browser Windows:**
1. Mở nhiều cửa sổ Incognito/Private
2. Truy cập `http://localhost:3000` trên mỗi cửa sổ
3. Thực hiện các action khác nhau

**Cách 2 - Different Devices:**
1. Mở app trên máy tính: `http://localhost:3000`
2. Mở trên điện thoại (cùng WiFi): `http://YOUR_IP:3000`
3. Lấy IP máy: `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)

---

## 📊 Metrics cần quan sát

### 1. Server Performance
```bash
# Terminal 1: Run app
npm run dev

# Terminal 2: Monitor
# - Response times
# - Console logs
# - Error rates
```

### 2. Database (PostgreSQL)
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
```

### 3. Watch for:
- ❌ Connection pool exhausted
- ❌ Slow response times (> 1s)
- ❌ Database locks
- ❌ Memory leaks
- ❌ Rate limiting triggered

---

## 🔧 Troubleshooting

### Database connection limit
```javascript
// Update src/lib/postgres/client.ts
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 20,  // Increase from default 10
});
```

### Next.js concurrent requests
```javascript
// next.config.js
module.exports = {
    experimental: {
        workerThreads: true,
    }
}
```

---

## 📈 Recommended Tools by Use Case

| Use Case | Tool | Why |
|----------|------|-----|
| Quick test | Artillery quick | Fast, no config needed |
| Realistic scenarios | Artillery config | Support complex flows |
| CI/CD integration | K6 | Good metrics, scriptable |
| Simple Node test | custom script | Full control, customizable |
| Manual testing | Multiple browsers | Quick validation |

---

## 🎬 Example Artillery Test Results

```
All VUs finished. Total time: 3 minutes, 30 seconds

Summary report @ 15:30:25(+0700)
  Scenarios launched:  1000
  Scenarios completed: 1000
  Requests completed:  5000
  Mean response/sec:   23.81
  Response time (msec):
    min: 45
    max: 1234
    median: 145
    p95: 456
    p99: 789
  Scenario duration (msec):
    min: 234
    max: 3456
    median: 1234
    p95: 2345
    p99: 3012
  Codes:
    200: 4850
    404: 100
    500: 50
```

Good performance nếu:
- ✅ p95 < 500ms
- ✅ Error rate < 1%
- ✅ No 5xx errors
