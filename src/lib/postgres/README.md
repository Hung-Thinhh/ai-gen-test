# PostgreSQL Connection Setup

## Connection Details
- **Host:** 77.42.94.105
- **Port:** 3100
- **Database:** postgres
- **User:** postgres
- **Password:** yj5x6moshhlx1vcw

## Files Created

### 1. `src/lib/postgres/client.ts`
PostgreSQL connection client using Neon serverless driver.

**Exports:**
- `pgSql` - Main SQL client
- `executePostgresQuery<T>()` - Query helper with error handling
- `testPostgresConnection()` - Test connection function

### 2. `src/lib/postgres/queries.ts`
Helper functions for common queries.

**Example functions:**
- `getAllTables()` - List all tables
- `getTableSchema(tableName)` - Get table structure
- `executeRawQuery<T>(query)` - Execute custom SQL

## Usage Examples

### Basic Query
```typescript
import { pgSql } from '@/lib/postgres/client';

// Simple query
const users = await pgSql`SELECT * FROM users LIMIT 10`;

// Parameterized query
const userId = 123;
const user = await pgSql`SELECT * FROM users WHERE id = ${userId}`;
```

### Using Helper Functions
```typescript
import { getAllTables, getTableSchema } from '@/lib/postgres/queries';

// Get all tables
const tables = await getAllTables();
console.log('Tables:', tables);

// Get schema for a specific table
const schema = await getTableSchema('users');
console.log('Schema:', schema);
```

### Test Connection
```typescript
import { testPostgresConnection } from '@/lib/postgres/client';

const isConnected = await testPostgresConnection();
if (isConnected) {
    console.log('✅ PostgreSQL connected!');
}
```

## API Route Example

Create `src/app/api/postgres/test/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { pgSql } from '@/lib/postgres/client';

export async function GET() {
    try {
        const result = await pgSql`SELECT NOW() as current_time`;
        return NextResponse.json({ 
            success: true, 
            data: result 
        });
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
```

## Security Notes

⚠️ **IMPORTANT:**
- Connection string contains credentials - keep it secure
- Consider moving to environment variable:
  ```
  POSTGRES_URL=postgresql://postgres:yj5x6moshhlx1vcw@77.42.94.105:3100/postgres
  ```
- Update `client.ts` to use:
  ```typescript
  const POSTGRES_URL = process.env.POSTGRES_URL!;
  ```

## Dependencies

Already installed:
- `@neondatabase/serverless` ✅

No additional packages needed!
