CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    source TEXT DEFAULT 'manual',
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_order_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure the user_id foreign key points to the application users table (not auth.users)
ALTER TABLE customers
    DROP CONSTRAINT IF EXISTS customers_user_id_fkey;

ALTER TABLE customers
    ADD CONSTRAINT customers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Seed customers from registered users
INSERT INTO customers (user_id, full_name, email, phone, source, created_at, updated_at)
SELECT DISTINCT
    u.id,
    COALESCE(NULLIF(TRIM(u.full_name), ''), CONCAT_WS(' ', NULLIF(TRIM(u.first_name), ''), NULLIF(TRIM(u.last_name), ''))),
    LOWER(u.email),
    NULLIF(TRIM(u.phone), ''),
    'registered',
    now(),
    now()
FROM users u
WHERE u.role = 'customer'
  AND u.email IS NOT NULL
ON CONFLICT (email) DO UPDATE
SET user_id = EXCLUDED.user_id,
    full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
    phone = COALESCE(EXCLUDED.phone, customers.phone),
    source = customers.source,
    updated_at = now();

WITH anon_orders AS (
    SELECT DISTINCT
        shipping_address->>'email' AS email,
        shipping_address->>'full_name' AS full_name,
        MAX(created_at) OVER (PARTITION BY shipping_address->>'email') AS last_order_at
    FROM orders
    WHERE customer_id IS NULL
      AND user_id IS NULL
      AND shipping_address->>'email' IS NOT NULL
)
INSERT INTO customers (email, full_name, source, last_order_at)
SELECT DISTINCT
    lower(email),
    NULLIF(trim(full_name), ''),
    'backfill' AS source,
    last_order_at
FROM anon_orders
WHERE email IS NOT NULL
ON CONFLICT (email) DO UPDATE
SET last_order_at = EXCLUDED.last_order_at,
    updated_at = now();

UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.customer_id IS NULL
  AND o.user_id IS NULL
  AND lower(o.shipping_address->>'email') = c.email;

UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.customer_id IS NULL
  AND o.user_id = c.user_id;

CREATE OR REPLACE FUNCTION set_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE PROCEDURE set_customers_updated_at();
