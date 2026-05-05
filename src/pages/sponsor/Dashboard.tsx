import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSponsorDashboard } from '@/hooks/sponsor/useSponsorDashboard';
import { TIER_PRICES } from '@/types/sponsor';
import type { ApplicationStatus, SponsorTier } from '@/types/sponsor';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft:        'bg-muted text-muted-foreground',
  submitted:    'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  approved:     'bg-green-100 text-green-800',
  rejected:     'bg-red-100 text-red-800',
  live:         'bg-emerald-100 text-emerald-800',
  closed:       'bg-gray-100 text-gray-600',
};

const STATUS_STEPS: ApplicationStatus[] = ['draft', 'submitted', 'under_review', 'approved', 'live'];

export default function SponsorDashboard() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { data, isLoading, error, refetch } = useSponsorDashboard(applicationId ?? '');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center space-y-4">
        <p className="text-destructive">Could not load your sponsorship.</p>
        <Button variant="outline" onClick={() => void refetch()}>Try again</Button>
      </div>
    );
  }

  if (!data) return null;

  const { application: app, organization: org, invoice, placements, roi, eventName } = data;
  const tier = app.tier as SponsorTier;
  const status = app.status as ApplicationStatus;

  const totalImpressions = roi.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = roi.reduce((s, r) => s + r.clicks, 0);
  const totalConversions = roi.reduce((s, r) => s + r.attributed_conversions, 0);
  const activePlacements = placements.filter(p => p.active).length;

  const chartData = roi.map(r => ({
    day: r.day.slice(5),
    impressions: r.impressions,
    clicks: r.clicks,
  }));

  const statusIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{org.display_name}</h1>
            <p className="text-muted-foreground mt-1">
              {eventName} · <span className="capitalize">{tier}</span> sponsor
            </p>
          </div>
          <Badge className={STATUS_COLORS[status]}>
            {status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Status timeline */}
        <div className="rounded-xl border p-5">
          <h2 className="text-sm font-medium mb-3">Application status</h2>
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div
                  className={`h-2 flex-1 rounded-full ${i <= statusIdx ? 'bg-primary' : 'bg-muted'}`}
                />
                {i === STATUS_STEPS.length - 1 && (
                  <div
                    className={`w-3 h-3 rounded-full ${i <= statusIdx ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STATUS_STEPS.map(s => (
              <span key={s} className="text-xs text-muted-foreground capitalize">
                {s.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Impressions (7d)', value: totalImpressions.toLocaleString() },
            { label: 'Clicks (7d)', value: totalClicks.toLocaleString() },
            { label: 'Conversions (7d)', value: totalConversions.toLocaleString() },
            { label: 'Active placements', value: `${activePlacements} / ${placements.length}` },
          ].map(m => (
            <Card key={m.label}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-bold">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ROI chart */}
        {chartData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Impressions & Clicks — Last 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No performance data yet — impressions appear once your placement goes live.
            </CardContent>
          </Card>
        )}

        {/* Invoice + package */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tier</span>
                <Badge className="capitalize">{tier}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  ${TIER_PRICES[tier].toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Activation</span>
                <span className="capitalize">{app.activation_type.replace(/_/g, ' ')}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {invoice ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span>
                      ${invoice.amount_cents.toLocaleString('es-CO')} {invoice.currency}
                    </span>
                  </div>
                  {invoice.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span>{new Date(invoice.paid_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Invoice created after admin approval.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cancel button — disabled, coming in task 058 */}
        {['signed', 'active'].includes(app.contract_status ?? '') && (
          <div className="pt-2">
            <Button variant="outline" disabled title="Cancel sponsorship — coming soon">
              Cancel sponsorship
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Cancellation workflow available after contract signing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
