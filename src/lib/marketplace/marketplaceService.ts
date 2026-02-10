// Marketplace Service
// API for browsing, purchasing, and managing presets

import { createClient } from '@supabase/supabase-js';
import type {
  PresetManifest,
  PresetCategory,
  PresetPricing,
} from '@/types/marketplace';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketplaceItem {
  id: string;
  manifest: PresetManifest;
  downloads: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  status: 'active' | 'pending' | 'rejected' | 'archived';
}

export interface MarketplaceQuery {
  search?: string;
  category?: PresetCategory;
  tags?: string[];
  priceRange?: { min?: number; max?: number };
  sortBy?: 'popular' | 'newest' | 'rating' | 'price-low' | 'price-high';
  page?: number;
  limit?: number;
  freeOnly?: boolean;
  verified?: boolean;
}

export interface MarketplaceResult {
  items: MarketplaceItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  downloadUrl?: string;
  license?: {
    id: string;
    expiresAt?: string;
    permissions: string[];
  };
}

export interface UserLibrary {
  owned: UserLibraryItem[];
  installed: string[];
  favorites: string[];
}

export interface UserLibraryItem {
  presetId: string;
  purchasedAt: string;
  price: number;
  licenseId: string;
  downloadCount: number;
  lastDownloaded?: string;
}

// ============================================================================
// MARKETPLACE SERVICE
// ============================================================================

class MarketplaceService {
  private supabase: ReturnType<typeof createClient> | null = null;

  private getClient() {
    if (!this.supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error('Missing Supabase credentials');
      }
      
      this.supabase = createClient(url, key);
    }
    return this.supabase;
  }

  // ============================================================================
  // BROWSING
  // ============================================================================

  async browse(query: MarketplaceQuery = {}): Promise<MarketplaceResult> {
    const client = this.getClient();
    const {
      search,
      category,
      tags,
      priceRange,
      sortBy = 'popular',
      page = 1,
      limit = 20,
      freeOnly,
      verified,
    } = query;

    let dbQuery = client
      .from('marketplace_items')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
    if (search) {
      dbQuery = dbQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }
    if (freeOnly) {
      dbQuery = dbQuery.is('price', null);
    }
    if (verified) {
      dbQuery = dbQuery.eq('author_verified', true);
    }
    if (priceRange?.min !== undefined) {
      dbQuery = dbQuery.gte('price', priceRange.min);
    }
    if (priceRange?.max !== undefined) {
      dbQuery = dbQuery.lte('price', priceRange.max);
    }
    if (tags && tags.length > 0) {
      dbQuery = dbQuery.overlaps('tags', tags);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        dbQuery = dbQuery.order('downloads', { ascending: false });
        break;
      case 'newest':
        dbQuery = dbQuery.order('published_at', { ascending: false });
        break;
      case 'rating':
        dbQuery = dbQuery.order('rating', { ascending: false });
        break;
      case 'price-low':
        dbQuery = dbQuery.order('price', { ascending: true, nullsFirst: true });
        break;
      case 'price-high':
        dbQuery = dbQuery.order('price', { ascending: false });
        break;
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error('Marketplace browse error:', error);
      return { items: [], total: 0, page, totalPages: 0, hasMore: false };
    }

    const items = (data || []).map(this.transformItem);
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getItem(id: string): Promise<MarketplaceItem | null> {
    const client = this.getClient();

    const { data, error } = await client
      .from('marketplace_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.transformItem(data);
  }

  async getFeatured(): Promise<MarketplaceItem[]> {
    const client = this.getClient();

    const { data, error } = await client
      .from('marketplace_items')
      .select('*')
      .eq('status', 'active')
      .eq('featured', true)
      .order('downloads', { ascending: false })
      .limit(8);

    if (error) return [];
    return (data || []).map(this.transformItem);
  }

  // ============================================================================
  // PURCHASING
  // ============================================================================

  async purchase(
    userId: string,
    presetId: string,
    paymentInfo?: { token?: string; method?: string }
  ): Promise<PurchaseResult> {
    const client = this.getClient();

    // Get the preset
    const preset = await this.getItem(presetId);
    if (!preset) {
      return { success: false, error: 'Preset not found' };
    }

    const price = preset.manifest.pricing?.priceUsd || 0;

    // Check if already owned
    const { data: existing } = await client
      .from('user_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('preset_id', presetId)
      .single();

    if (existing) {
      return { success: false, error: 'Already owned' };
    }

    // If free, just record the purchase
    if (price === 0) {
      const { error } = await client
        .from('user_purchases')
        .insert({
          user_id: userId,
          preset_id: presetId,
          price: 0,
          payment_status: 'completed',
        } as never);

      if (error) {
        return { success: false, error: error.message };
      }

      // Increment download count
      await this.incrementDownloads(presetId);

      return {
        success: true,
        downloadUrl: (await this.getDownloadUrl(presetId)) || undefined,
        license: {
          id: `license-${presetId}-${userId}`,
          permissions: preset.manifest.license.permissions,
        },
      };
    }

    // For paid items, process payment (placeholder for Stripe integration)
    // TODO: Integrate with Stripe
    return {
      success: false,
      error: 'Paid purchases not yet implemented. Coming soon!',
    };
  }

  async getDownloadUrl(presetId: string): Promise<string | null> {
    const client = this.getClient();

    // Get signed URL for preset file
    const { data, error } = await client
      .storage
      .from('marketplace-presets')
      .createSignedUrl(`presets/${presetId}.youcast-preset`, 3600); // 1 hour

    if (error) return null;
    return data?.signedUrl || null;
  }

  // ============================================================================
  // USER LIBRARY
  // ============================================================================

  async getUserLibrary(userId: string): Promise<UserLibrary> {
    const client = this.getClient();

    // Get purchases
    const { data: purchases } = await client
      .from('user_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_status', 'completed');

    // Get installed presets
    const { data: installed } = await client
      .from('user_installed_presets')
      .select('preset_id')
      .eq('user_id', userId);

    // Get favorites
    const { data: favorites } = await client
      .from('user_favorites')
      .select('preset_id')
      .eq('user_id', userId);

    return {
      owned: (purchases || []).map((p: Record<string, unknown>) => ({
        presetId: p.preset_id as string,
        purchasedAt: p.purchased_at as string,
        price: p.price as number,
        licenseId: p.license_id as string,
        downloadCount: p.download_count as number,
        lastDownloaded: p.last_downloaded as string | undefined,
      })),
      installed: (installed || []).map((i: Record<string, unknown>) => i.preset_id as string),
      favorites: (favorites || []).map((f: Record<string, unknown>) => f.preset_id as string),
    };
  }

  async toggleFavorite(userId: string, presetId: string): Promise<boolean> {
    const client = this.getClient();

    // Check if already favorited
    const { data: existing } = await client
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('preset_id', presetId)
      .single();

    if (existing) {
      await client
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('preset_id', presetId);
      return false;
    } else {
      await client
        .from('user_favorites')
        .insert({ user_id: userId, preset_id: presetId } as never);
      return true;
    }
  }

  // ============================================================================
  // PUBLISHING (Creator side)
  // ============================================================================

  async submitPreset(
    userId: string,
    manifest: PresetManifest,
    presetFile: Blob
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    const client = this.getClient();

    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate ID
    const presetId = manifest.id || `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Upload preset file
    const { error: uploadError } = await client
      .storage
      .from('marketplace-presets')
      .upload(`presets/${presetId}.youcast-preset`, presetFile);

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Create database entry
    const { error: dbError } = await client
      .from('marketplace_items')
      .insert({
        id: presetId,
        user_id: userId,
        name: manifest.name,
        description: manifest.description,
        category: manifest.category,
        tags: manifest.tags,
        manifest: manifest,
        price: manifest.pricing?.priceUsd || null,
        author_verified: false,
        status: 'pending',
        downloads: 0,
        rating: 0,
        review_count: 0,
        published_at: new Date().toISOString(),
      } as never);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true, id: presetId };
  }

  // ============================================================================
  // REVIEWS
  // ============================================================================

  async addReview(
    userId: string,
    presetId: string,
    rating: number,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();

    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Check if user owns the preset
    const { data: purchase } = await client
      .from('user_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('preset_id', presetId)
      .single();

    if (!purchase) {
      return { success: false, error: 'Must purchase to review' };
    }

    // Add/update review
    const { error } = await client
      .from('preset_reviews')
      .upsert({
        user_id: userId,
        preset_id: presetId,
        rating,
        comment,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: 'user_id,preset_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update preset rating
    await this.updatePresetRating(presetId);

    return { success: true };
  }

  private async updatePresetRating(presetId: string): Promise<void> {
    const client = this.getClient();

    const { data: reviews } = await client
      .from('preset_reviews')
      .select('rating')
      .eq('preset_id', presetId);

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((a, b: { rating: number }) => a + b.rating, 0) / reviews.length;
      await client
        .from('marketplace_items')
        .update({
          rating: Math.round(avg * 10) / 10,
          review_count: reviews.length,
        } as never)
        .eq('id', presetId);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async incrementDownloads(presetId: string): Promise<void> {
    const client = this.getClient();
    await client.rpc('increment_downloads', { preset_id: presetId } as never);
  }

  private transformItem(data: Record<string, unknown>): MarketplaceItem {
    return {
      id: data.id as string,
      manifest: data.manifest as PresetManifest,
      downloads: data.downloads as number || 0,
      rating: data.rating as number || 0,
      reviewCount: data.review_count as number || 0,
      featured: data.featured as boolean || false,
      publishedAt: data.published_at as string,
      updatedAt: data.updated_at as string,
      status: data.status as 'active' | 'pending' | 'rejected' | 'archived',
    };
  }

  private validateManifest(manifest: PresetManifest): { valid: boolean; error?: string } {
    if (!manifest.name || manifest.name.length < 3) {
      return { valid: false, error: 'Name must be at least 3 characters' };
    }
    if (!manifest.description || manifest.description.length < 10) {
      return { valid: false, error: 'Description must be at least 10 characters' };
    }
    if (!manifest.category) {
      return { valid: false, error: 'Category is required' };
    }
    if (!manifest.author?.name) {
      return { valid: false, error: 'Author name is required' };
    }
    if (!manifest.license?.type) {
      return { valid: false, error: 'License type is required' };
    }
    return { valid: true };
  }
}

// Export singleton
export const marketplaceService = new MarketplaceService();
