export interface BuiltinDataset {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: string[];
}

export interface BuiltinDatasetsResponse {
  datasets: BuiltinDataset[];
}

export interface UploadedDataset {
  id: string;
  name: string;
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[]; // first 5 rows
}

export interface UploadResponse {
  id: string;
  name: string;
  rows: number;
  columns: string[];
  preview: Record<string, unknown>[];
}
