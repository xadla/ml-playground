import api from '@/api/client';
import type {
  CreateExperimentRequest,
  ExperimentCreateResponse,
  ExperimentStatus,
} from '@/features/experiments/types';
import type { MessageResponse } from '@/features/auth/types';

export async function createExperiment(
  data: CreateExperimentRequest
): Promise<ExperimentCreateResponse> {
  const response = await api.post<ExperimentCreateResponse>('/experiments', data);
  return response.data;
}

export async function getExperimentStatus(id: string): Promise<ExperimentStatus> {
  const response = await api.get<ExperimentStatus>(`/experiments/${id}`);
  return response.data;
}

export async function saveExperiment(id: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>(`/experiments/${id}/save`);
  return response.data;
}
