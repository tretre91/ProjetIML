import { Component, createStream, Service, Stream } from '@marcellejs/core';
import 'list.js';
import List from 'list.js';
import { DatasetSnapshot } from '../../types';
import View from './dataset-list.view.svelte';

export class Row {
  id: string;
  name: string;
  timestamp: Date;
  selected: boolean;

  constructor(id: string, name: string, timestamp: string) {
    this.id = id;
    this.name = name;
    this.timestamp = new Date(timestamp);
    this.selected = false;
  }
}

export class DatasetList extends Component {
  title: string;
  snapshotsService: Service<DatasetSnapshot>;
  rows: Row[];
  list: List;
  $load: Stream<DatasetSnapshot>;

  constructor(service: Service<DatasetSnapshot>) {
    super();
    this.title = "Dataset List";
    this.snapshotsService = service;
    this.rows = [];
    this.list = undefined;
    this.$load = createStream<DatasetSnapshot>(Stream.never());
  }

  setup(): void {
    this.updateSnapshots().then(() => {
      let options = {
        valueNames: ["name", "creation-time"],
        // item: '<tr><td><input type="checkbox" bind:checked={rows[i].selected}/></td><td class="name">{name}</td><td class="creation-time">{timestamp}</td></tr>',
      };
      this.list = new List("snapshots", options);
    });
    this.refreshList();
  }

  refreshList(): void {
    if (this.list !== undefined) {
      this.list.update();
    }
    console.log(this.rows);
  }

  async updateSnapshots(): Promise<void> {
    this.snapshotsService
      .find()
      .then((snapshots) => {
        this.rows = (snapshots as DatasetSnapshot[])
          .map((snapshot) => {
            return new Row(snapshot.id, snapshot.name, snapshot.createdAt)
          });
      })
      .then(() => {
        this.refreshList();
      })
  }

  select(i: number, v: boolean): void {
    this.rows[i].selected = v;
  }

  loadInstances(i: number): void {
    this.snapshotsService
      .get(this.rows[i].id)
      .then((snapshot) => this.$load.set(snapshot));
  }

  async deleteSelected(): Promise<void> {
    let p = Promise.resolve();
    this.rows.forEach((row) => {
      if (row.selected) {
        p.then(() => {
          return this.snapshotsService.remove(row.id);
        });
      }
    });
    p.then((_) => this.updateSnapshots());
  }

  mount(target?: HTMLElement): void {
    const t = target || document.querySelector(`#${this.id}`);
    if (!t) return;
    this.destroy();
    this.$$.app = new View({
      target: t,
      props: {
        title: this.title,
        rows: this.rows,
        setup: this.setup,
        refreshList: this.refreshList,
        select: this.select,
        loadInstances: this.loadInstances,
      },
    });
  }
}
