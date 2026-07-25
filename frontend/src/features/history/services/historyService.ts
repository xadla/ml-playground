import api from '@/api/client';
import type {
  HistoryListResponse,
  CompareRequest,
  CompareResult,
} from '@/features/history/types/history';

export const historyService = {
  getHistory: async (
    page = 1,
    size = 10,
    sort?: string,
    order?: string,
    search?: string
  ): Promise<HistoryListResponse> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (sort) params.set('sort', sort);
    if (order) params.set('order', order);
    if (search) params.set('search', search);
    const res = await api.get<HistoryListResponse>('/history', { params });
    return res.data;
  },

  deleteExperiment: async (id: string): Promise<void> => {
    await api.delete(`/history/${id}`);
  },

  compareExperiments: async (ids: string[]): Promise<CompareResult> => {
    const res = await api.post<CompareResult>('/history/compare', {
      experiment_ids: ids,
    } as CompareRequest);
    return res.data;
  },
};
