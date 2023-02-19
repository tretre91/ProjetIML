import { DatasetSummary } from './dataset-summary.component';

export function datasetSummary(...args: ConstructorParameters<typeof DatasetSummary>): DatasetSummary {
  return new DatasetSummary(...args);
}

export type { DatasetSummary };
