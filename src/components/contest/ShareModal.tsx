import { Share2, Copy, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestTitle: string;
  entityName: string;
  shareUrl: string;
}

export function ShareModal({
  open,
  onOpenChange,
  contestTitle,
  entityName,
  shareUrl,
}: ShareModalProps) {
  const text = `¡Voté por ${entityName} en ${contestTitle}! 🏆 Únete y apóyala también.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      toast.success("¡Enlace copiado!");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: contestTitle, text, url: shareUrl });
    } catch {
      // user cancelled
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <DialogTitle>¡Comparte tu voto!</DialogTitle>
          </div>
          <DialogDescription>
            Comparte y ayuda a {entityName} a ganar más votos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button className="w-full" onClick={handleNativeShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          )}
          <Button variant="outline" className="w-full bg-green-500/10 border-green-500/30 text-green-700 hover:bg-green-500/20" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" className="w-full bg-sky-500/10 border-sky-500/30 text-sky-700 hover:bg-sky-500/20" asChild>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              X / Twitter
            </a>
          </Button>
          <Button variant="ghost" className="w-full" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar enlace
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-1">
          Cada voto de tus amigos cuenta 💜
        </p>
      </DialogContent>
    </Dialog>
  );
}
