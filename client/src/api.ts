import type {
  SimulationRun,
  RoundData,
  RoundResult,
  EndReport,
  CreateRunInput,
  SubmitDecisionsInput,
  Metrics,
} from 'shared';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = BASE_URL ? `${BASE_URL}${path}` : `/api${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  createRun: (data: CreateRunInput) =>
    request<SimulationRun & { currentMetrics: Metrics }>('/runs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRun: (id: string) => request<SimulationRun>(`/runs/${id}`),

  getRound: (runId: string, roundNumber: number) =>
    request<RoundData>(`/runs/${runId}/round/${roundNumber}`),

  submitDecisions: (runId: string, roundNumber: number, data: SubmitDecisionsInput) =>
    request<RoundResult>(`/runs/${runId}/round/${roundNumber}/decisions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReport: (runId: string) => request<EndReport>(`/runs/${runId}/report`),
};
