import api from '@/api/client';
import type { BuiltinDataset, UploadResponse } from '@/features/datasets/types';

export const datasetService = {
  getBuiltinDatasets: async (): Promise<BuiltinDataset[]> => {
    try {
      const res = await api.get('/datasets/builtin');

      let datasets: BuiltinDataset[] = [];

      if (res.data && res.data.datasets && Array.isArray(res.data.datasets)) {
        datasets = res.data.datasets;
      } else if (Array.isArray(res.data)) {
        datasets = res.data;
      } else {
        datasets = [];
      }

      return datasets; // Always returns an array
    } catch (error) {
      return []; // Return empty array on error
    }
  },

  uploadDataset: async (
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<UploadResponse>('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  getDatasetPreview: async (id: string): Promise<UploadResponse> => {
    const res = await api.get<UploadResponse>(`/datasets/${id}/preview`);
    return res.data;
  },
};
