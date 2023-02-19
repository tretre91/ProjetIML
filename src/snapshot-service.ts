import * as marcelle from '@marcellejs/core';
import { Params, Id, NullableId, Application } from '@feathersjs/feathers'
import { DatasetSnapshot } from './types';

/**
 * @brief Custom feathers service for storing snapshots
 */
export class SnapshotService {
  service: marcelle.Service<DatasetSnapshot>;

  constructor(service: marcelle.Service<DatasetSnapshot>) {
    this.service = service;
  }

  /**
   * @brief Finds snapshots in the datastore
   *
   * The `params` object can have a `filter` field in order to filter the returned
   * snapshots, for example `service.find({ filters: {name: "foo" }})` will
   * return all snapshots with the name "foo".
   *
   * @return A list of snapshots
   */
  async find(params: Params = {}): Promise<DatasetSnapshot[]> {
    return this.service
      .find({ paginate: false })
      .then((result) => {
        let datasets = result as DatasetSnapshot[];
        let nameFilter = params.filters?.name?.trim();
        if (nameFilter != undefined && nameFilter != "") {
          let dataset = datasets.find((dataset) => { return dataset.name == nameFilter; });
          return dataset != undefined ? [dataset] : [];
        }
        return datasets;
      });
  }
  async get(id: Id, params: Params) { return this.service.get(id, params); }
  async create(data: any, params: Params) { console.log("creating"); return this.service.create(data, params); }
  async update(id: NullableId, data: any, params: Params) { return this.service.update(id, data, params); }
  async patch(id: NullableId, data: any, params: Params) { return this.service.patch(id, data, params); }
  async remove(id: NullableId, params: Params) { return this.service.remove(id, params); }
  async setup(app: Application, path: string) { return this.service.setup(app, path); }
  async teardown(app: Application, path: string) { return this.service.teardown(app, path); }
}
