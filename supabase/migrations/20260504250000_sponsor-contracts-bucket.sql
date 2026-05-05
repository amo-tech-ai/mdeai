-- Create the contracts storage bucket idempotently.
-- Used by sponsor-contract-generate edge fn to store HTML contract files.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contracts', 'contracts', false, 10485760, ARRAY['text/html', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;
