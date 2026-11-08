alter table public."Rakvih_orders"
  add column if not exists payment_proof_url text;
