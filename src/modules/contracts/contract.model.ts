export interface Contract {
  id: string;
  employee_id: string;
  contract_type?: "full_time" | "part_time" | "casual" | "probation" | null;
  start_date?: string | null; // ISO date
  end_date?: string | null; // ISO date
  base_salary?: number | null;
  probation_end_date?: string | null;
  signed_doc_url?: string | null;
  is_active?: boolean | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const CONTRACTS_COLLECTION = "contracts";
