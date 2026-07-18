import api from '@/api/client';
import type { BuiltinDataset, UploadResponse } from '@/types/dataset';

export const datasetService = {
  getBuiltinDatasets: async (): Promise<BuiltinDataset[]> => {
    const res = await api.get<BuiltinDataset[]>('/datasets/builtin');
    return res.data;
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
