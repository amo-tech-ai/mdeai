/**
 * /host/contest/:slug/apply/thanks — Pantalla de confirmación post-inscripción.
 *
 * Muestra mensaje de éxito y enlace de regreso al concurso.
 */
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplyThanks() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Success icon */}
        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" aria-hidden />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold">
            ¡Solicitud enviada!
          </h1>
          <p className="text-muted-foreground text-sm">
            Estamos revisando tu información. En{" "}
            <strong className="text-foreground">24–48 horas</strong> te
            notificaremos por WhatsApp o correo electrónico con el resultado.
          </p>
        </div>

        {/* What happens next */}
        <div className="rounded-xl border bg-card p-4 text-left space-y-3 text-sm">
          <p className="font-medium text-foreground">¿Qué sigue?</p>
          <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
            <li>El equipo verifica tus documentos e imágenes.</li>
            <li>Recibes una notificación con la decisión.</li>
            <li>Si es aprobada, tu perfil aparece en el concurso en vivo.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {slug && (
            <Button asChild className="w-full">
              <Link to={`/vote/${slug}`}>Ver el concurso</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">Ir a mi cuenta</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          ¿Tienes preguntas?{" "}
          <a
            href="mailto:hola@mdeai.co"
            className="underline underline-offset-4 text-primary"
          >
            Escríbenos
          </a>
        </p>
      </div>
    </div>
  );
}
