import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContractRow {
  id: string;
  sponsor_user_id: string;
  application_id: string;
  status: string;
  pdf_storage_path: string | null;
  sponsor_signed_at: string | null;
  sponsor_display_name: string | null;
  created_at: string;
}

export interface ContractWithPdfUrl {
  contract: ContractRow;
  pdfSignedUrl: string | null;
}

export interface SignContractInput {
  contract_id: string;
  display_name: string;
}

export interface SignContractResponse {
  success: true;
  data: {
    contract_id: string;
    placements_activated: number;
  };
}

// ---------------------------------------------------------------------------
// useContractQuery
// ---------------------------------------------------------------------------

/**
 * Loads a sponsor contract row and generates a signed Storage URL for the PDF.
 * Expiry: 3600 seconds (1 hour).
 */
export function useContractQuery(contractId: string | undefined) {
  return useQuery<ContractWithPdfUrl, Error>({
    queryKey: ["sponsor-contract", contractId],
    enabled: !!contractId,
    staleTime: 60_000, // 1 minute
    queryFn: async (): Promise<ContractWithPdfUrl> => {
      if (!contractId) throw new Error("contract_id is required");

      // Cast to access the sponsor schema — supabase-js Browser SDK supports
      // schema() on the client object but TypeScript types don't expose it.
      const sponsorClient = (
        supabase as unknown as { schema: (s: string) => typeof supabase }
      ).schema("sponsor");

      const { data: contractData, error: contractErr } = await (
        sponsorClient as unknown as {
          from: (
            table: string,
          ) => {
            select: (
              cols: string,
            ) => {
              eq: (
                col: string,
                val: string,
              ) => { maybeSingle: () => Promise<{ data: ContractRow | null; error: { message: string } | null }> };
            };
          };
        }
      )
        .from("contracts")
        .select(
          "id, sponsor_user_id, application_id, status, pdf_storage_path, sponsor_signed_at, sponsor_display_name, created_at",
        )
        .eq("id", contractId)
        .maybeSingle();

      if (contractErr) throw new Error(contractErr.message);
      if (!contractData) throw new Error("Contract not found");

      // Generate a signed URL for the PDF if a storage path exists.
      let pdfSignedUrl: string | null = null;
      if (contractData.pdf_storage_path) {
        const { data: urlData, error: urlErr } = await supabase.storage
          .from("sponsor-contracts")
          .createSignedUrl(contractData.pdf_storage_path, 3600);

        if (!urlErr && urlData?.signedUrl) {
          pdfSignedUrl = urlData.signedUrl;
        }
      }

      return { contract: contractData, pdfSignedUrl };
    },
  });
}

// ---------------------------------------------------------------------------
// useSignContract
// ---------------------------------------------------------------------------

/**
 * Mutation that calls the sponsor-contract-sign edge function.
 * Returns placements_activated count on success.
 */
export function useSignContract() {
  return useMutation<SignContractResponse, Error, SignContractInput>({
    mutationFn: async (input: SignContractInput): Promise<SignContractResponse> => {
      const { data, error } = await supabase.functions.invoke(
        "sponsor-contract-sign",
        { body: input },
      );

      if (error) throw error;

      const response = data as SignContractResponse;
      if (!response.success) {
        throw new Error("Unexpected response from server");
      }
      return response;
    },
  });
}
