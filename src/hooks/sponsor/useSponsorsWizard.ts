import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  WizardDraft,
  SponsorOrganizationInput,
  SponsorApplicationInput,
  SponsorAssetInput,
  SponsorApplicationCreateResponse,
} from "@/types/sponsor";

const DRAFT_KEY = "sponsor:wizard:v1";

type StepDataKey = "organization" | "application" | "assets";
type StepDataValue = Partial<SponsorOrganizationInput> | Partial<SponsorApplicationInput> | Partial<SponsorAssetInput>;

function loadDraft(): WizardDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WizardDraft;
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return { step: 1, organization: {}, application: {}, assets: {} };
}

function saveDraftToStorage(draft: WizardDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage errors
  }
}

export function useSponsorsWizard() {
  const [draft, setDraft] = useState<WizardDraft>(loadDraft);

  const saveDraft = useCallback((updated: WizardDraft) => {
    saveDraftToStorage(updated);
    setDraft(updated);
  }, []);

  const setStepData = useCallback(
    (key: StepDataKey, data: StepDataValue) => {
      setDraft((prev) => {
        const updated: WizardDraft = { ...prev, [key]: data };
        saveDraftToStorage(updated);
        return updated;
      });
    },
    [],
  );

  const goNext = useCallback(() => {
    setDraft((prev) => {
      const nextStep = Math.min(prev.step + 1, 4) as 1 | 2 | 3 | 4;
      const updated: WizardDraft = { ...prev, step: nextStep };
      saveDraftToStorage(updated);
      return updated;
    });
  }, []);

  const goBack = useCallback(() => {
    setDraft((prev) => {
      const prevStep = Math.max(prev.step - 1, 1) as 1 | 2 | 3 | 4;
      const updated: WizardDraft = { ...prev, step: prevStep };
      saveDraftToStorage(updated);
      return updated;
    });
  }, []);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraft({ step: 1, organization: {}, application: {}, assets: {} });
  }, []);

  const submitApplicationMutation = useMutation({
    mutationFn: async (): Promise<SponsorApplicationCreateResponse> => {
      const currentDraft = loadDraft();
      const { data, error } = await supabase.functions.invoke(
        "sponsor-application-create",
        {
          body: {
            step: currentDraft.step,
            organization: currentDraft.organization,
            application: currentDraft.application,
            assets: currentDraft.assets,
            draft_application_id: currentDraft.draft_application_id,
          },
        },
      );

      if (error) throw error;

      const response = data as SponsorApplicationCreateResponse;

      // Persist returned IDs into draft
      setDraft((prev) => {
        const updated: WizardDraft = {
          ...prev,
          draft_application_id: response.data.application_id,
          draft_organization_id: response.data.organization_id,
        };
        saveDraftToStorage(updated);
        return updated;
      });

      return response;
    },
  });

  return {
    draft,
    step: draft.step,
    setStepData,
    goNext,
    goBack,
    saveDraft,
    submitApplicationMutation,
    clearDraft,
  };
}
