import { useState } from 'react';
import { Mail, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional retry-after hint if the limit response included one. */
  retryAfterSeconds?: number;
}

/**
 * Soft email gate — shown when an anonymous visitor exhausts their
 * message quota. Sends a Supabase magic link; on click, user returns
 * authenticated and the conversation resumes (rate limit flips to the
 * higher authenticated rate).
 *
 * Keeps friction low:
 *   · only asks for email, no password
 *   · doesn't force-close (can browse site while waiting for email)
 *   · shows clear "check your inbox" success state
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Fri.
 */
export function EmailGateModal({ open, onOpenChange, retryAfterSeconds }: EmailGateModalProps) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success('Check your email for a sign-in link.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not send sign-in link',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle>Keep chatting — sign in with email</DialogTitle>
          <DialogDescription>
            {sent
              ? `We sent a sign-in link to ${email}. Click it from your inbox to continue chatting. You can close this window; the conversation will be waiting.`
              : 'You\u2019ve hit the free-preview limit. No password needed — we\u2019ll send a magic link to pick up right where you left off.'}
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={busy}
            />
            <Button type="submit" className="w-full" disabled={busy || !email.trim()}>
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>Send sign-in link</>
              )}
            </Button>
            {retryAfterSeconds != null && retryAfterSeconds > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Or wait {Math.ceil(retryAfterSeconds / 60)} min for your free quota to refresh.
              </p>
            )}
          </form>
        ) : (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-900 dark:text-emerald-200">
              Link sent. Check your inbox.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
