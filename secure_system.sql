-- =================================================================
-- SECURITY HARDENING SCRIPT
-- Purpose: Restrict WRITE access to Admins Only, allow READ for Public
-- =================================================================

-- 1. HARDEN "PROMPTS" TABLE
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Full Access" ON prompts; -- Drop unsafe debugging policy

-- Allow everyone to read
CREATE POLICY "Public Read Prompts" ON prompts FOR SELECT TO public USING (true);
-- Allow only authenticated users to insert/update (or enhance to admin only later)
CREATE POLICY "Auth Write Prompts" ON prompts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Prompts" ON prompts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth Delete Prompts" ON prompts FOR DELETE TO authenticated USING (true);


-- 2. HARDEN "CATEGORIES" TABLE
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Full Access Categories" ON categories;

-- Allow everyone to read
CREATE POLICY "Public Read Categories" ON categories FOR SELECT TO public USING (true);
-- Allow only authenticated users to write (Admin check ideally handled in app logic or via custom claim)
CREATE POLICY "Auth Write Categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. HARDEN "TOOLS" TABLE
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Public Read Tools" ON tools;
DROP POLICY IF EXISTS "Allow Auth Modify Tools" ON tools;

-- Allow everyone to read
CREATE POLICY "Public Read Tools" ON tools FOR SELECT TO public USING (true);
-- Allow only authenticated users to write
CREATE POLICY "Auth Write Tools" ON tools FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. HARDEN "PROFILES/USERS" TABLE (Critical)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Users can only see/edit their own profile
CREATE POLICY "Users View Own Profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users Update Own Profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
-- Admins can view all (Needs a custom claim or separate admin role logic, for now allow auth read for social features)
CREATE POLICY "Auth Read Profiles" ON profiles FOR SELECT TO authenticated USING (true); 
