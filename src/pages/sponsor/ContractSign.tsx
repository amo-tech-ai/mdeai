import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ContractViewer } from "@/components/sponsor/ContractViewer";
import { SignatureForm } from "@/components/sponsor/SignatureForm";
import { useContractQuery, useSignContract } from "@/hooks/sponsor/useContractSign";
import { cn } from "@/lib/utils";

export default function ContractSign() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const contractQuery = useContractQuery(contractId);
  const signMutation = useSignContract();

  // Auto-redirect after successful signing
  useEffect(() => {
    if (signMutation.isSuccess) {
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [signMutation.isSuccess, navigate]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (contractQuery.isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-6">
          <Skeleton className="flex-1 h-[600px] rounded-lg" />
          <Skeleton className="w-80 h-[480px] rounded-lg" />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (contractQuery.isError || !contractQuery.data) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4">
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-3 text-center">
            <p className="text-destructive font-medium">Failed to load contract</p>
            <p className="text-sm text-muted-foreground">
              {contractQuery.error?.message ?? "Contract not found or you do not have access."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { contract, pdfSignedUrl } = contractQuery.data;

  // ── Already-signed state ───────────────────────────────────────────────────
  if (contract.status === "signed") {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4">
        <Card>
          <CardHeader className="flex flex-col items-center gap-3 text-center pb-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" aria-hidden="true" />
            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
              Contract Signed
            </Badge>
            <CardTitle className="text-xl">You have already signed this contract</CardTitle>
            {contract.sponsor_signed_at && (
              <CardDescription>
                Signed on{" "}
                {new Date(contract.sponsor_signed_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {contract.sponsor_display_name ? ` by ${contract.sponsor_display_name}` : ""}
              </CardDescription>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 flex justify-center">
            <Link
              to={`/sponsor/dashboard/${contract.application_id}`}
              className={cn(
                "inline-flex items-center gap-2 text-sm font-medium",
                "text-primary hover:underline",
              )}
            >
              View placements
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Active signing view ────────────────────────────────────────────────────
  async function handleSign(displayName: string) {
    if (!contractId) return;

    try {
      const result = await signMutation.mutateAsync({
        contract_id: contractId,
        display_name: displayName,
      });

      if (result.data.placements_activated > 0) {
        toast.success("Your placements are now live!");
      } else {
        toast.success("Contract signed! Complete payment to activate your placements.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign contract";
      toast.error(message);
    }
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-foreground">
          Sign Your Sponsorship Contract
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review the agreement below, then sign with your full name to proceed.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left — PDF viewer (55%) */}
        <div className="w-full lg:w-[55%]">
          <ContractViewer signedUrl={pdfSignedUrl} />
        </div>

        {/* Right — summary + signature (45%) */}
        <div className="w-full lg:w-[45%] flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contract summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract ID</span>
                <span className="font-mono text-xs">{contract.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">Awaiting signature</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(contract.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your signature</CardTitle>
              <CardDescription className="text-xs">
                By signing, you confirm that you have legal authority to bind your
                organization to this agreement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignatureForm
                onSign={handleSign}
                isLoading={signMutation.isPending || signMutation.isSuccess}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
