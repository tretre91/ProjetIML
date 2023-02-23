import { Component, Dataset, datasetBrowser, DatasetBrowser, Select, select, Service } from '@marcellejs/core';
import * as marcelle from '@marcellejs/core';
import View from './dataset-summary.view.svelte';
import { DatasetSnapshot } from "../../types";

// type of a function which generates a component given a snapshot
export type VisualizationGenerator = (snapshot: DatasetSnapshot) => Component;

export class DatasetSummary extends Component {
  title: string;
  snapshotsService: Service<DatasetSnapshot>;
  currentDataset: Dataset<any>;
  selectMenu: Select;
  browser: DatasetBrowser;
  visGenerators: VisualizationGenerator[];
  currentVisualizations: Component[];

  constructor(snapshots: Service<DatasetSnapshot>, visualizations: VisualizationGenerator[] = []) {
    super();
    this.title = 'Dataset summary';
    this.snapshotsService = snapshots;
    this.currentDataset = marcelle.dataset(`tmp.${this.id}`, marcelle.dataStore());
    this.selectMenu = select([]);
    this.selectMenu.title = "choose a dataset";
    this.browser = datasetBrowser(this.currentDataset);
    this.visGenerators = visualizations;
    this.currentVisualizations = [];
    for (let i = 0; i < this.visGenerators.length; i++) {
      let text = marcelle.text("Nothing to see here 😶‍🌫️");
      text.title = "A visualization ...";
      this.currentVisualizations.push(text);
    }


    this.selectMenu.$value.subscribe(async (name) => {
      let datasets = await this.snapshotsService.find({ filters: { name: name } }) as DatasetSnapshot[];
      if (datasets == undefined || datasets.length == 0) {
        console.log("No dataset named", name);
        return;
      }

      // update the dataset browser
      const dataset = datasets[0];
      this.currentDataset.$count.set(0);
      let f = new File([dataset.instances], dataset.name, { type: "application/json" });
      this.currentDataset.upload([f]);
      this.mountComponent(this.browser, "browser-mount");

      // update the user's visualizations
      for (let i = 0; i < this.currentVisualizations.length; i++) {
        this.currentVisualizations[i].destroy();
        this.currentVisualizations[i] = this.visGenerators[i](dataset);
        this.mountComponent(this.currentVisualizations[i], `visualization-mount-${i}`);
      }
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
        visualizations: this.visGenerators,
      },
    });
    this.mountComponent(this.selectMenu, "select-mount");
    this.mountComponent(this.browser, "browser-mount");
    this.currentVisualizations.forEach((vis, i) => this.mountComponent(vis, `visualization-mount-${i}`));
  }
}
