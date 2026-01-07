-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Policy to allow Admins to UPDATE packages
-- Fix: Cast auth.uid() to text because users.user_id is varchar
CREATE POLICY "Allow admins to update packages" 
ON packages 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid()::text 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

-- Allow Admins to INSERT
CREATE POLICY "Allow admins to insert packages" 
ON packages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

-- Allow Admins to DELETE
CREATE POLICY "Allow admins to delete packages" 
ON packages 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

NOTIFY pgrst, 'reload config';
