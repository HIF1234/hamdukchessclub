import { supabase } from "@/integrations/supabase/client";

export type UploadBucket = "avatars" | "school-logos" | "tournament-banners";

const MAX_SIZE: Record<UploadBucket, number> = {
  "avatars": 5 * 1024 * 1024,
  "school-logos": 5 * 1024 * 1024,
  "tournament-banners": 10 * 1024 * 1024,
};

/**
 * Uploads `file` to `<bucket>/<ownerId>/<ts>-<safeName>` and returns the
 * public URL. RLS on storage.objects enforces ownership server-side.
 */
export async function uploadImage(
  bucket: UploadBucket,
  ownerId: string,
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_SIZE[bucket]) {
    throw new Error("Image is too large.");
  }
  const safe = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const path = `${ownerId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}