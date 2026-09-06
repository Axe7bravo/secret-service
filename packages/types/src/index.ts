export interface Dossier {
  id: string; operationId: string; title: string; shortTitle: string;
  price: number; stage: string; timeframe: string; clearance: string;
  description: string; cardDescription: string; previewDescription?: string;
  tags: readonly string[]; image: string;
}
