import type { Metrics } from '@/features/experiments/types/index';

export interface HistoryExperiment {
  id: string;
  experiment_id: string;
  algorithm: string;
  dataset_name: string;
  metrics: Metrics;
  created_at: string;
}

export interface HistoryListResponse {
  items: HistoryExperiment[];
  total: number;
  page: number;
  size: number;
}

export interface CompareRequest {
  experiment_ids: string[];
}

export interface CompareResult {
  experiments: {
    experiment_id: string;
    algorithm: string;
    dataset_name: string;
    metrics: Metrics;
  }[];
}
