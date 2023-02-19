import { Component, Dataset, datasetBrowser, DatasetBrowser, Select, select, Service } from '@marcellejs/core';
import * as marcelle from '@marcellejs/core';
import View from './dataset-summary.view.svelte';
import { DatasetSnapshot } from "../../types";

export class DatasetSummary extends Component {
  title: string;
  snapshotsService: Service<DatasetSnapshot>;
  currentDataset: Dataset<any>;
  selectMenu: Select;
  visualization: DatasetBrowser;

  constructor(snapshots: Service<DatasetSnapshot>) {
    super();
    this.title = 'Dataset summary';
    this.snapshotsService = snapshots;
    this.currentDataset = marcelle.dataset(`tmp.${this.id}`, marcelle.dataStore());
    this.selectMenu = select([]);
    this.selectMenu.title = "choose a dataset";
    this.visualization = datasetBrowser(this.currentDataset);

    this.selectMenu.$value.subscribe(async (name) => {
      let datasets = await this.snapshotsService.find({ filters: { name: name } }) as DatasetSnapshot[];
      if (datasets == undefined || datasets.length == 0) {
        console.log("No dataset named", name);
        return;
      }
      const dataset = datasets[0];
      this.currentDataset.$count.set(0);
      let f = new File([dataset.data], dataset.name, { type: "application/json" });
      this.currentDataset.upload([f]);
      this.mountComponent(this.visualization, "visualization-mount");
    });

    this.updateDatasets();
  }

  mountComponent(component: Component, targetTag: string): void {
    let root = document.getElementById(this.id);
    let target = root.getElementsByClassName(targetTag)[0];
    component.mount(target as HTMLElement);
  }

  async updateDatasets(): Promise<void> {
    this.snapshotsService
      .find()
      .then((datasets) => {
        this.selectMenu.$options.set((datasets as DatasetSnapshot[]).map((dataset) => dataset.name));
      });
  }

  mount(target?: HTMLElement): void {
    const t = target || document.querySelector(`#${this.id}`);
    if (!t) return;
    this.destroy();
    this.$$.app = new View({
      target: t,
      props: {
        title: this.title,
      },
    });
    this.mountComponent(this.selectMenu, "select-mount");
    this.mountComponent(this.visualization, "visualization-mount");
  }
}
