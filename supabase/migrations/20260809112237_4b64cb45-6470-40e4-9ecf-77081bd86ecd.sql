ALTER TABLE public.hamduk_accounts ADD COLUMN IF NOT EXISTS sync_error text;

ALTER TABLE public.hamduk_accounts DROP CONSTRAINT IF EXISTS hamduk_accounts_link_status_check;
ALTER TABLE public.hamduk_accounts ADD CONSTRAINT hamduk_accounts_link_status_check CHECK (link_status IN ('pending','linked','error'));