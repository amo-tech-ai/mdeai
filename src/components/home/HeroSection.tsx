import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

// Hero images
import skylineImg from "@/assets/hero/medellin-skyline.jpg";
import guatapeImg from "@/assets/hero/guatape-colors.jpg";
import beachPalmsImg from "@/assets/hero/beach-palms.jpg";
import waterfallImg from "@/assets/hero/waterfall.jpg";
import beachWavesImg from "@/assets/hero/beach-waves.jpg";
import coffeeFarmImg from "@/assets/hero/coffee-farm.jpg";
import streetFoodImg from "@/assets/hero/street-food.jpg";
import colonialStreetImg from "@/assets/hero/colonial-street.jpg";

interface MasonryImageProps {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
}

function MasonryImage({ src, alt, className, delay = 0 }: MasonryImageProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative py-12 md:py-16 lg:py-20 bg-secondary/50">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main container with white background */}
        <div className="bg-card rounded-3xl shadow-elevated p-6 md:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="lg:col-span-5 space-y-6">
              {/* Brand */}
              <div className="animate-fade-in">
                <BrandLogo variant="hero" />
              </div>

              {/* Main headline */}
              <h1
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in"
                style={{ animationDelay: "100ms" }}
              >
                Your Next Adventure Starts Here in Colombia
              </h1>

              {/* Supporting text */}
              <p
                className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in"
                style={{ animationDelay: "200ms" }}
              >
                Your guide to discovering cities, experiences, and unforgettable
                trips across Colombia.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row gap-4 pt-2 animate-fade-in"
                style={{ animationDelay: "300ms" }}
              >
                <Link to="/explore">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8"
                  >
                    Explore experiences
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto rounded-full border-muted-foreground/30 text-foreground hover:bg-muted/50 px-8"
                >
                  Subscribe
                </Button>
              </div>

              {/* Trust indicator */}
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in"
                style={{ animationDelay: "400ms" }}
              >
                <Check className="w-4 h-4 text-primary" />
                <span>Free to explore • No credit card required</span>
              </div>
            </div>

            {/* Right Column - Masonry Grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-3 gap-3 auto-rows-[120px] md:auto-rows-[140px]">
                {/* Large image - spans 2 cols, 2 rows */}
                <MasonryImage
                  src={skylineImg}
                  alt="Medellín skyline at golden hour"
                  className="col-span-2 row-span-2"
                  delay={400}
                />

                {/* Small square */}
                <MasonryImage
                  src={guatapeImg}
                  alt="Colorful buildings in Guatapé"
                  className="col-span-1 row-span-1"
                  delay={450}
                />

                {/* Tall image */}
                <MasonryImage
                  src={beachPalmsImg}
                  alt="Palm trees and Caribbean sea"
                  className="col-span-1 row-span-2"
                  delay={500}
                />

                {/* Medium images - bottom row */}
                <MasonryImage
                  src={waterfallImg}
                  alt="Tropical waterfall in Colombia"
                  className="col-span-1 row-span-1"
                  delay={550}
                />

                <MasonryImage
                  src={beachWavesImg}
                  alt="Sandy beach with waves"
                  className="col-span-1 row-span-1"
                  delay={600}
                />

                {/* Large image - spans 2 cols */}
                <MasonryImage
                  src={streetFoodImg}
                  alt="Colombian street food vendor"
                  className="col-span-2 row-span-1"
                  delay={650}
                />

                {/* Small image */}
                <MasonryImage
                  src={colonialStreetImg}
                  alt="Colonial street in Cartagena"
                  className="col-span-1 row-span-1"
                  delay={700}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
