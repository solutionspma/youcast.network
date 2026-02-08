import type { MediaMetadata } from '@/types';

// ─── Storage Provider Interface ──────────────────────────────────────
// Abstract interface — swap providers without touching consuming code.

export interface StorageProvider {
  upload(file: File, path: string, options?: UploadOptions): Promise<UploadResult>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  delete(path: string): Promise<void>;
  list(prefix: string): Promise<StorageFile[]>;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  metadata: MediaMetadata;
}

export interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  updated_at: string;
  content_type: string;
}

// ─── Supabase Storage Implementation ─────────────────────────────────

export class SupabaseStorageProvider implements StorageProvider {
  private bucket: string;

  constructor(bucket = 'media') {
    this.bucket = bucket;
  }

  async upload(file: File, path: string, options?: UploadOptions): Promise<UploadResult> {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        contentType: options?.contentType ?? file.type,
        upsert: false,
      });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
      size: file.size,
      metadata: {
        format: file.type,
        file_size_bytes: file.size,
        storage_provider: 'supabase',
        storage_path: data.path,
      },
    };
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    return data.signedUrl;
  }

  async delete(path: string): Promise<void> {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { error } = await supabase.storage.from(this.bucket).remove([path]);
    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  async list(prefix: string): Promise<StorageFile[]> {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data, error } = await supabase.storage.from(this.bucket).list(prefix);
    if (error) throw new Error(`List failed: ${error.message}`);

    return (data ?? []).map((f) => ({
      name: f.name,
      path: `${prefix}/${f.name}`,
      size: f.metadata?.size ?? 0,
      created_at: f.created_at ?? '',
      updated_at: f.updated_at ?? '',
      content_type: f.metadata?.mimetype ?? '',
    }));
  }
}

// ─── Factory ─────────────────────────────────────────────────────────

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!_provider) {
    const providerType = process.env.MEDIA_STORAGE_PROVIDER ?? 'supabase';
    switch (providerType) {
      case 'supabase':
      default:
        _provider = new SupabaseStorageProvider();
        break;
      // Future providers: s3, gcs, azure, etc.
    }
  }
  return _provider;
}
