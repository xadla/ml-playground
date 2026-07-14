export interface CanvasPoint {
  x: number;
  y: number;
  class: string; // backend expects "class"
}

export interface CanvasDataset {
  type: 'canvas';
  name: string;
  points: CanvasPoint[];
  feature_names: string[];
}

export interface CreateExperimentRequest {
  dataset: CanvasDataset; // initially only canvas; later we'll support uploaded/builtin via union
  algorithm: string;
  hyperparameters: Record<string, unknown>;
  target_column: string;
}

export interface ExperimentCreateResponse {
  experiment_id: string;
  status: string;
  message: string;
}

export interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface ExperimentResult {
  metrics: Metrics;
  confusion_matrix: number[][];
  plots: {
    decision_boundary?: string;
    confusion_matrix_heatmap?: string;
  };
}

export interface ExperimentStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  algorithm?: string;
  hyperparameters?: Record<string, unknown>;
  dataset_name?: string;
  dataset_id?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  result?: ExperimentResult;
  error_message?: string;
}
