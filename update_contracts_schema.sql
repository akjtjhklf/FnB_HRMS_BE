-- Add salary_scheme_id column to contracts table
-- Note: Adjust the data type (UUID or CHAR(36)) based on your database type (PostgreSQL vs MySQL)

-- For PostgreSQL:
ALTER TABLE contracts ADD COLUMN salary_scheme_id UUID NULL;

-- For MySQL:
-- ALTER TABLE contracts ADD COLUMN salary_scheme_id CHAR(36) NULL;

-- Add Foreign Key Constraint (Optional but recommended)
-- ALTER TABLE contracts ADD CONSTRAINT fk_contracts_salary_scheme FOREIGN KEY (salary_scheme_id) REFERENCES salary_schemes(id) ON DELETE SET NULL;
