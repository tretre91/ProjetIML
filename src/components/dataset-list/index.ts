import { DatasetList } from './dataset-list.component';

export function datasetList(...args: ConstructorParameters<typeof DatasetList>): DatasetList {
  return new DatasetList(...args);
}

export type { DatasetList };
