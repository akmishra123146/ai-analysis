-- 1. Create Extension & ENUM types
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estimate_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create Base Tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'LEAD',
    sales_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lead_generator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    due_date DATE,
    status task_status DEFAULT 'OPEN'
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'DRAFT',
    paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    estimate_number VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    valid_until DATE NOT NULL,
    status estimate_status DEFAULT 'DRAFT'
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type activity_type NOT NULL,
    body TEXT NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    generated_sql TEXT,
    was_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    row_count INT,
    model VARCHAR(100),
    input_tokens INT,
    output_tokens INT,
    cost_usd NUMERIC(10, 6),
    latency_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_sales_manager ON contacts(sales_manager_id);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_generator ON contacts(lead_generator_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact ON invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_estimates_contact ON estimates(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_user ON ai_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_created ON ai_queries(created_at);

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if any
DROP POLICY IF EXISTS contact_visibility_policy ON contacts;
DROP POLICY IF EXISTS task_visibility_policy ON tasks;
DROP POLICY IF EXISTS invoice_visibility_policy ON invoices;
DROP POLICY IF EXISTS estimate_visibility_policy ON estimates;
DROP POLICY IF EXISTS activity_visibility_policy ON activities;
DROP POLICY IF EXISTS attachment_visibility_policy ON attachments;

-- 6. Define Contacts Scoping RLS Policy
CREATE POLICY contact_visibility_policy ON contacts
FOR ALL USING (
    -- Admin sees everything
    NULLIF(current_setting('app.current_user_role', true), '') = 'ADMIN'
    OR
    -- Manager sees contacts assigned as sales_manager_id
    (NULLIF(current_setting('app.current_user_role', true), '') = 'MANAGER' 
     AND sales_manager_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR
    -- Team Member sees contacts assigned as lead_generator_id
    (NULLIF(current_setting('app.current_user_role', true), '') = 'MEMBER' 
     AND lead_generator_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR
    -- Fallback for superuser / system queries when session variable is unset
    NULLIF(current_setting('app.current_user_id', true), '') IS NULL
);

-- 7. Define Subsidiary Entity RLS Policies (Inherited Visibility)
CREATE POLICY task_visibility_policy ON tasks
FOR ALL USING (
    contact_id IN (SELECT id FROM contacts)
);

CREATE POLICY invoice_visibility_policy ON invoices
FOR ALL USING (
    contact_id IN (SELECT id FROM contacts)
);

CREATE POLICY estimate_visibility_policy ON estimates
FOR ALL USING (
    contact_id IN (SELECT id FROM contacts)
);

CREATE POLICY activity_visibility_policy ON activities
FOR ALL USING (
    contact_id IN (SELECT id FROM contacts)
);

CREATE POLICY attachment_visibility_policy ON attachments
FOR ALL USING (
    contact_id IN (SELECT id FROM contacts)
);
