import { useState, useCallback, useRef } from "react";
import { Search, Download } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventAttendees, type AttendeeRow } from "@/hooks/host/useEventAttendees";
import { supabase } from "@/integrations/supabase/client";

interface AttendeeTableProps {
  eventId: string;
  eventName: string;
}

const PAGE_SIZE = 50;

function CheckInStatus({ row }: { row: AttendeeRow }) {
  if (row.status === "refunded") {
    return <Badge variant="outline" className="text-xs">Refunded</Badge>;
  }
  if (row.status === "cancelled") {
    return <span className="text-xs text-muted-foreground">Cancelled</span>;
  }
  if (row.status === "pending") {
    return <Badge variant="secondary" className="text-xs">Pending</Badge>;
  }
  if (row.qr_used_at) {
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400">
        ✓ {format(new Date(row.qr_used_at), "MMM d · h:mm a")}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Not scanned</span>;
}

export function AttendeeTable({ eventId, eventName }: AttendeeTableProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const { data, isLoading, error } = useEventAttendees(
    eventId,
    debouncedSearch,
    page,
    PAGE_SIZE,
  );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  async function handleExport() {
    setExporting(true);
    try {
      const { data: exportData, error: exportError } = await supabase.rpc(
        "event_attendees_paginated",
        { p_event_id: eventId, p_search: debouncedSearch, p_limit: 10_000, p_offset: 0 },
      );
      if (exportError) throw exportError;
      const rows = (exportData as { rows: AttendeeRow[] }).rows ?? [];
      const header = "name,email,ticket_tier,purchase_time,check_in_status,checked_in_at,short_id";
      const csvLines = rows.map((r) =>
        [
          `"${r.full_name.replace(/"/g, '""')}"`,
          `"${r.email}"`,
          `"${r.tier_name}"`,
          `"${r.purchase_time}"`,
          r.qr_used_at ? "used" : r.status === "refunded" ? "refunded" : "unused",
          r.qr_used_at ?? "",
          `"${r.order_short_id}"`,
        ].join(","),
      );
      const csv = [header, ...csvLines].join("\n");
      const dateStr = format(new Date(), "yyyy-MM-dd");
      const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
      const filename = `attendees-${slug}-${dateStr}.csv`;
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">
            Attendees
            {data ? (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                ({data.total.toLocaleString()})
              </span>
            ) : null}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name or email…"
                className="h-8 w-48 pl-8 text-sm"
                data-testid="attendee-search"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || !data?.total}
              data-testid="export-csv"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="space-y-2 px-4 pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-center text-sm text-destructive">{error.message}</p>
        ) : !data?.rows.length ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {debouncedSearch
              ? `No attendees matching "${debouncedSearch}".`
              : "No active attendees yet — share your event to start selling."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="attendee-table">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Tier</th>
                    <th className="px-4 py-2 font-medium">Purchased</th>
                    <th className="px-4 py-2 font-medium">Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-b-0"
                      data-testid={`attendee-row-${r.id}`}
                    >
                      <td className="px-4 py-3 font-medium">{r.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                      <td className="px-4 py-3">{r.tier_name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(new Date(r.purchase_time), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <CheckInStatus row={r} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages} · {data.total.toLocaleString()} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    data-testid="prev-page"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
