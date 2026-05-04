import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { SponsorAssetInput } from "@/types/sponsor";

const MAX_LOGO_BYTES  = 5 * 1024 * 1024;  // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const LOGO_MIME_TYPES  = ["image/svg+xml", "image/png"];
const VIDEO_MIME_TYPES = ["video/mp4"];

const step3Schema = z.object({
  tagline:         z.string().max(150).optional(),
  utm_destination: z.string().url("Enter a valid URL"),
  brand_color:     z.string().optional(),
});

type Step3FormValues = z.infer<typeof step3Schema>;

interface Step3AssetsProps {
  defaultValues: Partial<SponsorAssetInput>;
  onNext: (data: SponsorAssetInput) => void;
  onBack: () => void;
}

function generatePath(prefix: string, filename: string): string {
  const uuid = crypto.randomUUID();
  return `${prefix}/${uuid}-${filename}`;
}

export function Step3Assets({ defaultValues, onNext, onBack }: Step3AssetsProps) {
  const [logoPath, setLogoPath]         = useState<string | undefined>(defaultValues.logo_path);
  const [logoPreview, setLogoPreview]   = useState<string | undefined>();
  const [logoError, setLogoError]       = useState<string | undefined>();
  const [logoUploading, setLogoUploading] = useState(false);

  const [videoPath, setVideoPath]           = useState<string | undefined>(defaultValues.video_path);
  const [videoError, setVideoError]         = useState<string | undefined>();
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoFileName, setVideoFileName]   = useState<string | undefined>();

  const logoInputRef  = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<Step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      tagline:         defaultValues.tagline         ?? "",
      utm_destination: defaultValues.utm_destination ?? "",
      brand_color:     defaultValues.brand_color     ?? "#000000",
    },
  });

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(undefined);

    if (!LOGO_MIME_TYPES.includes(file.type)) {
      setLogoError("Logo must be SVG or PNG.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo must be 5 MB or smaller.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    setLogoUploading(true);

    try {
      const path = generatePath("logos", file.name);
      const { data, error } = await supabase.storage
        .from("sponsor-assets")
        .upload(path, file, { upsert: true });

      if (error) {
        setLogoError("Upload failed. Please try again.");
        setLogoPreview(undefined);
        return;
      }
      setLogoPath(data.path);
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError(undefined);

    if (!VIDEO_MIME_TYPES.includes(file.type)) {
      setVideoError("Video must be MP4.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoError("Video must be 50 MB or smaller.");
      return;
    }

    setVideoUploading(true);
    setVideoFileName(file.name);

    try {
      const path = generatePath("videos", file.name);
      const { data, error } = await supabase.storage
        .from("sponsor-assets")
        .upload(path, file, { upsert: true });

      if (error) {
        setVideoError("Upload failed. Please try again.");
        setVideoFileName(undefined);
        return;
      }
      setVideoPath(data.path);
    } finally {
      setVideoUploading(false);
    }
  }

  function clearLogo() {
    setLogoPath(undefined);
    setLogoPreview(undefined);
    setLogoError(undefined);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function onSubmit(values: Step3FormValues) {
    if (!logoPath) {
      setLogoError("Please upload a logo before continuing.");
      return;
    }

    const output: SponsorAssetInput = {
      logo_path:       logoPath,
      utm_destination: values.utm_destination,
      ...(videoPath          ? { video_path: videoPath }           : {}),
      ...(values.tagline     ? { tagline: values.tagline }         : {}),
      ...(values.brand_color ? { brand_color: values.brand_color } : {}),
    };
    onNext(output);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo upload */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">Logo (SVG or PNG) *</p>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/svg+xml,image/png"
            className="sr-only"
            onChange={handleLogoChange}
            aria-label="Upload logo"
          />

          {logoPreview ? (
            <div className="relative inline-flex">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-20 w-auto rounded border border-border object-contain bg-muted p-2"
              />
              <button
                type="button"
                onClick={clearLogo}
                className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5"
                aria-label="Remove logo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className={cn(
                "flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-border py-8 text-sm text-muted-foreground transition-colors",
                logoUploading ? "opacity-60 cursor-not-allowed" : "hover:border-primary hover:text-primary cursor-pointer",
              )}
            >
              <Upload className="w-5 h-5" />
              {logoUploading ? "Uploading…" : "Click to upload logo"}
              <span className="text-xs">SVG or PNG, max 5 MB</span>
            </button>
          )}

          {logoError && (
            <p className="text-sm text-destructive">{logoError}</p>
          )}
        </div>

        {/* Video upload (optional) */}
        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">Video (MP4, optional)</p>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4"
            className="sr-only"
            onChange={handleVideoChange}
            aria-label="Upload video"
          />

          {videoPath ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate max-w-[200px]">{videoFileName ?? "Video uploaded"}</span>
              <button
                type="button"
                onClick={() => {
                  setVideoPath(undefined);
                  setVideoFileName(undefined);
                  if (videoInputRef.current) videoInputRef.current.value = "";
                }}
                className="text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={videoUploading}
              className={cn(
                "flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm transition-colors",
                videoUploading ? "opacity-60 cursor-not-allowed" : "hover:bg-muted cursor-pointer",
              )}
            >
              <Upload className="w-4 h-4" />
              {videoUploading ? "Uploading…" : "Upload video"}
            </button>
          )}

          {videoError && (
            <p className="text-sm text-destructive">{videoError}</p>
          )}
        </div>

        {/* Text fields */}
        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tagline</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your brand's voice in one line (max 150 characters)"
                  maxLength={150}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="utm_destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Destination URL *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://acme.com/campaign?utm_source=mdeai"
                  type="url"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Color</FormLabel>
              <FormControl>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={field.value ?? "#000000"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded border border-border p-0.5"
                    aria-label="Brand color picker"
                  />
                  <span className="text-sm text-muted-foreground font-mono">
                    {field.value ?? "#000000"}
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            type="submit"
            disabled={logoUploading || videoUploading}
            className="flex-1"
          >
            Next: Review
          </Button>
        </div>
      </form>
    </Form>
  );
}
