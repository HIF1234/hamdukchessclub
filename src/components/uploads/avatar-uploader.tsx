import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/uploads/upload";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  currentUrl: string | null;
  fallback: string;
  onUploaded: (url: string) => void;
}

export function AvatarUploader({ userId, currentUrl, fallback, onUploaded }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const url = await uploadImage("avatars", userId, file);
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      if (error) throw new Error(error.message);
      onUploaded(url);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-20">
        {currentUrl ? <AvatarImage src={currentUrl} alt="Profile photo" /> : null}
        <AvatarFallback>{fallback.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <Button size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={busy}>
          <Camera className="size-4 mr-2" />
          {busy ? "Uploading…" : currentUrl ? "Change photo" : "Upload photo"}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP or GIF up to 5MB.</p>
      </div>
    </div>
  );
}