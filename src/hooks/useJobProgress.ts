import { useState, useCallback } from 'react';
import { useRealtimeChannel, RealtimeEvent } from './useRealtimeChannel';

export interface JobProgress {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string | null;
  totalSteps: number | null;
}

export interface UseJobProgressOptions {
  jobId: string | null;
  onComplete?: (jobId: string) => void;
  onError?: (jobId: string, error: string) => void;
}

/**
 * Hook for subscribing to AI job progress updates via Realtime.
 * Subscribe when job starts, auto-unsubscribe on completion/failure.
 */
export function useJobProgress({ jobId, onComplete, onError }: UseJobProgressOptions) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (event.type === 'job_status_changed') {
      const payload = event.payload as {
        id: string;
        status: string;
        progress: number;
        current_step: string | null;
        total_steps: number | null;
      };

      const newProgress: JobProgress = {
        id: payload.id,
        status: payload.status as JobProgress['status'],
        progress: payload.progress || 0,
        currentStep: payload.current_step,
        totalSteps: payload.total_steps,
      };

      setProgress(newProgress);

      // Auto-cleanup on terminal states
      if (payload.status === 'completed') {
        onComplete?.(payload.id);
      } else if (payload.status === 'failed') {
        onError?.(payload.id, 'Job failed');
      }
    }
  }, [onComplete, onError]);

  const topic = jobId ? `job:${jobId}:status` : '';
  
  const { cleanup } = useRealtimeChannel({
    topic,
    enabled: !!jobId,
    onEvent: handleEvent,
  });

  const startWatching = useCallback(() => {
    if (jobId) {
      setIsSubscribed(true);
      setProgress({
        id: jobId,
        status: 'queued',
        progress: 0,
        currentStep: null,
        totalSteps: null,
      });
    }
  }, [jobId]);

  const stopWatching = useCallback(() => {
    cleanup();
    setIsSubscribed(false);
    setProgress(null);
  }, [cleanup]);

  return {
    progress,
    isSubscribed,
    startWatching,
    stopWatching,
  };
}
