-- Applied via MCP on 2026-05-08; captured as local file.
-- Assigns roles to the 3 known platform users
-- mde@socialmediaville.ca → admin
-- ai@socialmediaville.ca  → super_admin
-- sanjiv.khullar@gmail.com → moderator
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role::user_role
FROM (VALUES
  ('59454bf4-ad17-41cc-8ef2-23d7cc639b54'::uuid, 'admin'),
  ('036c956b-22f3-4f6b-ac78-9f97a38582c5'::uuid, 'super_admin'),
  ('857f14ef-6a19-406f-a344-86e35483fa47'::uuid, 'moderator')
) AS r(uid, role)
JOIN auth.users u ON u.id = r.uid
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = r.uid AND ur.role = r.role::user_role
);
