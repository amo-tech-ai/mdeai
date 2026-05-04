import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SponsorApplicationCard } from "@/components/admin/SponsorApplicationCard";
import {
  useSponsorApplications,
  useApproveSponsorApplication,
  useRejectSponsorApplication,
  type SponsorApplicationStatus,
  type AdminSponsorApplication,
} from "@/hooks/admin/useSponsorApplications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TABS: { label: string; value: SponsorApplicationStatus | 'all' }[] = [
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

export default function AdminSponsorships() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SponsorApplicationStatus | 'all'>('submitted');
  const [rejectTarget, setRejectTarget] = useState<AdminSponsorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { toast } = useToast();

  const { data: applications, isLoading, error } = useSponsorApplications(
    activeTab === 'all' ? undefined : activeTab
  );
  const approve = useApproveSponsorApplication();
  const reject = useRejectSponsorApplication();

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 10) {
      toast({ title: 'Rejection reason must be at least 10 characters.', variant: 'destructive' });
      return;
    }
    await reject.mutateAsync({ applicationId: rejectTarget.id, reason: rejectReason.trim() });
    setRejectTarget(null);
    setRejectReason('');
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Sponsorship Applications</h1>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value}>
              {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1,2,3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                </div>
              )}
              {error && (
                <p className="text-destructive text-sm">Failed to load applications: {(error as Error).message}</p>
              )}
              {!isLoading && !error && !applications?.length && (
                <p className="text-muted-foreground text-sm text-center py-16">No applications in this category.</p>
              )}
              {!isLoading && !error && !!applications?.length && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {applications.map((app) => (
                    <SponsorApplicationCard
                      key={app.id}
                      application={app}
                      onView={() => navigate(`/admin/sponsorships/${app.id}`)}
                      onApprove={() => approve.mutate(app.id)}
                      onReject={() => setRejectTarget(app)}
                      isApproving={approve.isPending && approve.variables === app.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Explain why this application is being rejected (min 10 characters)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={reject.isPending}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
