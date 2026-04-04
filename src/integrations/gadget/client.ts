import { MdeaiClient } from "@gadget-client/mdeai";

// Public client — anonymous access for product browsing (no auth required)
// The Unauthenticated role must have read access to shopifyProduct in Gadget dashboard
export const gadgetApi = new MdeaiClient({
  environment: import.meta.env.PROD ? "Production" : "Development",
});
