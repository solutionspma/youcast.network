'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type { MediaItem, MediaType, MediaStatus, PaginatedResponse } from '@/types';

interface UseMediaOptions {
  channelId?: string;
  type?: MediaType;
  status?: MediaStatus;
  page?: number;
  limit?: number;
}

interface UseMediaReturn {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
  uploadMedia: (file: File, metadata: Partial<MediaItem>) => Promise<MediaItem | null>;
  deleteMedia: (id: string) => Promise<boolean>;
  updateMedia: (id: string, data: Partial<MediaItem>) => Promise<MediaItem | null>;
}

export function useMedia(options: UseMediaOptions = {}): UseMediaReturn {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(options.page || 1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchMedia = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.channelId) params.set('channelId', options.channelId);
      if (options.type) params.set('type', options.type);
      if (options.status) params.set('status', options.status);
      params.set('page', String(page));
      params.set('limit', String(options.limit || 20));

      const response = await apiClient.get<PaginatedResponse<MediaItem>>(`/media?${params}`);
      if (response) {
        if (page === 1) {
          setItems(response.data);
        } else {
          setItems(prev => [...prev, ...response.data]);
        }
        setTotalCount(response.total);
        setCurrentPage(response.page);
        setTotalPages(response.total_pages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  }, [options.channelId, options.type, options.status, options.limit]);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    fetchMedia(1);
  }, [fetchMedia]);

  const loadMore = useCallback(() => {
    if (currentPage < totalPages && !loading) {
      fetchMedia(currentPage + 1);
    }
  }, [currentPage, totalPages, loading, fetchMedia]);

  const uploadMedia = useCallback(async (file: File, metadata: Partial<MediaItem>): Promise<MediaItem | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const item = await apiClient.post<MediaItem>('/media/upload', formData as unknown as Record<string, unknown>);
      if (item) {
        setItems(prev => [item, ...prev]);
        return item;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  }, []);

  const deleteMedia = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/media/${id}`);
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      return false;
    }
  }, []);

  const updateMedia = useCallback(async (id: string, data: Partial<MediaItem>): Promise<MediaItem | null> => {
    try {
      const updated = await apiClient.patch<MediaItem>(`/media/${id}`, data as unknown as Record<string, unknown>);
      if (updated) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
        return updated;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      return null;
    }
  }, []);

  return {
    items,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasMore: currentPage < totalPages,
    refresh,
    loadMore,
    uploadMedia,
    deleteMedia,
    updateMedia,
  };
}
