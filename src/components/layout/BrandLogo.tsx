import { cn } from "@/lib/utils";

const LOGO_SRC = "/ilovemde.png";
const ALT = "mdeai.co";

type BrandLogoProps = {
  className?: string;
  /** nav: header; footer: dark footer chip; sidebar / sidebarCollapsed: left rail; panel: solid brand panels (e.g. primary bg); hero: home hero eyebrow */
  variant?:
    | "nav"
    | "footer"
    | "sidebar"
    | "sidebarCollapsed"
    | "panel"
    | "hero";
};

export function BrandLogo({ className, variant = "nav" }: BrandLogoProps) {
  const img = (
    <img
      src={LOGO_SRC}
      alt={ALT}
      width={320}
      height={80}
      className={cn(
        "w-auto object-contain object-left",
        variant === "nav" && "h-8 sm:h-9",
        variant === "footer" && "h-9 sm:h-10",
        variant === "sidebar" && "h-9 max-w-[200px]",
        variant === "sidebarCollapsed" && "h-9 w-full max-w-[9rem]",
        variant === "panel" && "h-12 sm:h-14 max-w-[min(100%,280px)] mx-auto",
        variant === "hero" && "h-10 md:h-12 max-w-[260px]",
        className
      )}
    />
  );

  if (variant === "footer") {
    return (
      <span className="inline-flex rounded-lg bg-background px-3 py-2 shadow-sm">
        {img}
      </span>
    );
  }

  if (variant === "panel") {
    return (
      <span className="inline-flex rounded-xl bg-primary-foreground/95 px-4 py-3 shadow-md">
        {img}
      </span>
    );
  }

  return img;
}
