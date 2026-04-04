import { cn } from "@/lib/utils";
import { MdeWordmarkOnDark } from "@/components/brand/MdeWordmarkOnDark";

const LOGO_SRC = "/ilovemde.png";
const ALT = "mdeai.co";

type BrandLogoProps = {
  className?: string;
  /** nav: header; footer: inline SVG wordmark on dark (true transparency); sidebar / sidebarCollapsed: left rail; panel: solid brand panels; hero: home hero */
  variant?:
    | "nav"
    | "footer"
    | "sidebar"
    | "sidebarCollapsed"
    | "panel"
    | "hero";
};

export function BrandLogo({ className, variant = "nav" }: BrandLogoProps) {
  if (variant === "footer") {
    return (
      <MdeWordmarkOnDark
        className={cn(
          "h-14 sm:h-16 md:h-18 max-w-[min(92vw,380px)]",
          className
        )}
      />
    );
  }

  const img = (
    <img
      src={LOGO_SRC}
      alt={ALT}
      width={320}
      height={80}
      decoding="async"
      className={cn(
        "w-auto object-contain object-left",
        variant === "nav" && "h-12 sm:h-14 md:h-16",
        variant === "sidebar" && "h-12 sm:h-14 max-w-[280px]",
        variant === "sidebarCollapsed" && "h-12 sm:h-14 w-full max-w-[12rem]",
        variant === "panel" &&
          "h-18 sm:h-22 max-w-[min(100%,380px)] mx-auto",
        variant === "hero" &&
          "h-16 md:h-20 max-w-[min(100%,440px)] md:max-w-[520px]",
        className
      )}
    />
  );

  if (variant === "panel") {
    return (
      <span className="inline-flex rounded-xl bg-primary-foreground/95 px-4 py-3 shadow-md">
        {img}
      </span>
    );
  }

  return img;
}
