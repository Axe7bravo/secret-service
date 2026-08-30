export interface Dossier {
  id: string; operationId: string; title: string; shortTitle: string;
  price: number; stage: string; timeframe: string; clearance: string;
  description: string; cardDescription: string; previewDescription?: string;
  tags: readonly string[]; image: string;
}
export interface DispatchInput {
  agent_id: string; operation_dossier: string; encrypted_payload: string;
  delivery_location: string; status: 'STAGED';
}
export interface DispatchResult { id: string }
