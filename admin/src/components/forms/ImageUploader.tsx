import { useEffect, useRef, useState } from "react";
import { ImageIcon, Images, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { mediaApi, type Media } from "@/lib/api";

/** Includes iPhone HEIC/HEIF and common web formats. */
export const IMAGE_UPLOAD_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif,.HEIC,.HEIF";

const aspectClasses = {
  square: "h-24 w-24 shrink-0",
  wide: "h-20 w-36 shrink-0",
  video: "h-24 w-40 shrink-0",
} as const;

export interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null, media?: Media | null) => void;
  label?: string;
  hint?: string;
  accept?: string;
  className?: string;
  aspect?: keyof typeof aspectClasses;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  label = "Image",
  hint,
  accept = IMAGE_UPLOAD_ACCEPT,
  className,
  aspect = "square",
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await mediaApi.upload(file);
      onChange(uploaded.url, uploaded);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <Label className="text-xs font-medium text-brown-muted">{label}</Label> : null}

      <div className="flex flex-wrap items-start gap-3">
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-border/70 bg-muted/30",
            aspectClasses[aspect],
            !value && "border-dashed",
          )}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-brown-muted/50">
              <ImageIcon className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[10px]">No image</span>
            </div>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-burgundy/40 backdrop-blur-[2px]">
              <Loader2 className="h-5 w-5 animate-spin text-cream" />
            </div>
          ) : null}
        </div>

        <div className="flex min-w-[140px] flex-1 flex-wrap gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={disabled || uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void handleUpload(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || uploading}
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || uploading}
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={() => setLibraryOpen(true)}
          >
            <Images className="h-3.5 w-3.5" />
            From media
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || uploading}
              className="h-8 gap-1.5 px-2.5 text-xs text-crimson hover:bg-crimson/10 hover:text-crimson"
              onClick={() => onChange(null, null)}
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {hint ? <p className="text-[11px] text-brown-muted/70">{hint}</p> : null}

      <MediaLibraryPicker
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(media) => {
          onChange(media.url, media);
          setLibraryOpen(false);
          toast.success("Image selected from media library");
        }}
      />
    </div>
  );
}

function MediaLibraryPicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: Media) => void;
}) {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    mediaApi
      .list(query || undefined)
      .then((res) => setItems(res))
      .catch(() => toast.error("Could not load media library"))
      .finally(() => setLoading(false));
  }, [open, query]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-5 py-4 text-left">
          <DialogTitle className="font-display text-xl text-burgundy">Choose from media</DialogTitle>
          <p className="text-sm text-brown-muted">Reuse an image already uploaded to Cloudinary.</p>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <Input placeholder="Search media..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-brown-muted">Loading...</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ImageIcon className="h-8 w-8 text-brown-muted/40" />
              <p className="text-sm text-brown-muted">No images in the library yet. Upload one first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-lg border bg-muted/30 transition-all",
                    selectedId === item.id
                      ? "ring-2 ring-yellow-brand ring-offset-2"
                      : "border-border/70 hover:border-yellow-brand/50",
                  )}
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.originalName || item.filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="border-t border-border/70 bg-cream/40 px-5 py-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!selected} onClick={() => selected && onSelect(selected)}>
            Use selected image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
