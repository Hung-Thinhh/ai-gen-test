-- Add missing columns to packages table
ALTER TABLE packages 
ADD COLUMN IF NOT EXISTS target TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'month',
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- Optional: Add badge_text if it was missing and we still read it (though we moved to discount)
-- ADD COLUMN IF NOT EXISTS badge_text TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
