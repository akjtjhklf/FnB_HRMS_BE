-- Add salary_scheme_id column to contracts table
ALTER TABLE contracts 
ADD COLUMN salary_scheme_id CHAR(36) NULL AFTER base_salary,
ADD FOREIGN KEY (salary_scheme_id) REFERENCES salary_schemes(id) ON DELETE SET NULL;
