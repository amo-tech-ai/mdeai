import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const updateMock = vi.fn();
const eqMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: (data: unknown) => {
        updateMock(data);
        return {
          eq: (col: string, val: string) => {
            eqMock(col, val);
            return Promise.resolve({ data: null, error: null });
          },
        };
      },
    }),
  },
}));

vi.mock("@/lib/posthog", () => ({ trackEvent: vi.fn() }));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { LeadStatusActions } from "./LeadStatusActions";

const LEAD_ID = "11111111-1111-1111-1111-111111111111";

function renderActions(props: Partial<React.ComponentProps<typeof LeadStatusActions>> = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <LeadStatusActions
        leadId={LEAD_ID}
        status="new"
        hadReply={false}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("LeadStatusActions visibility matrix", () => {
  beforeEach(() => {
    updateMock.mockClear();
    eqMock.mockClear();
  });

  it("status='new' shows Mark replied + Archive (no Reopen)", () => {
    renderActions({ status: "new" });
    expect(screen.getByTestId("lead-action-mark-replied")).toBeInTheDocument();
    expect(screen.getByTestId("lead-action-archive")).toBeInTheDocument();
    expect(screen.queryByTestId("lead-action-reopen")).not.toBeInTheDocument();
  });

  it("status='viewed' shows Mark replied + Archive", () => {
    renderActions({ status: "viewed" });
    expect(screen.getByTestId("lead-action-mark-replied")).toBeInTheDocument();
    expect(screen.getByTestId("lead-action-archive")).toBeInTheDocument();
  });

  it("status='replied' hides Mark replied; shows Archive only", () => {
    renderActions({ status: "replied", hadReply: true });
    expect(screen.queryByTestId("lead-action-mark-replied")).not.toBeInTheDocument();
    expect(screen.getByTestId("lead-action-archive")).toBeInTheDocument();
    expect(screen.queryByTestId("lead-action-reopen")).not.toBeInTheDocument();
  });

  it("status='archived' shows Reopen only", () => {
    renderActions({ status: "archived", hadReply: false });
    expect(screen.queryByTestId("lead-action-mark-replied")).not.toBeInTheDocument();
    expect(screen.queryByTestId("lead-action-archive")).not.toBeInTheDocument();
    expect(screen.getByTestId("lead-action-reopen")).toBeInTheDocument();
  });
});

describe("LeadStatusActions mutations", () => {
  beforeEach(() => {
    updateMock.mockClear();
    eqMock.mockClear();
  });

  it("Mark replied → UPDATE includes status='replied' AND first_reply_at", async () => {
    renderActions({ status: "new", hadReply: false });
    fireEvent.click(screen.getByTestId("lead-action-mark-replied"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe("replied");
    expect(typeof payload.first_reply_at).toBe("string");
    expect(eqMock).toHaveBeenCalledWith("id", LEAD_ID);
  });

  it("Mark replied with hadReply=true preserves first_reply_at (no overwrite)", async () => {
    renderActions({ status: "new", hadReply: true });
    fireEvent.click(screen.getByTestId("lead-action-mark-replied"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe("replied");
    expect(payload.first_reply_at).toBeUndefined();
  });

  it("Archive → UPDATE includes status='archived' AND archived_at", async () => {
    renderActions({ status: "new" });
    fireEvent.click(screen.getByTestId("lead-action-archive"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe("archived");
    expect(typeof payload.archived_at).toBe("string");
  });

  it("Reopen → UPDATE includes status='viewed' AND archived_at=null", async () => {
    renderActions({ status: "archived" });
    fireEvent.click(screen.getByTestId("lead-action-reopen"));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe("viewed");
    expect(payload.archived_at).toBeNull();
  });
});
