import { Component, Select, select, Service } from '@marcellejs/core';
import * as marcelle from '@marcellejs/core';
import View from './dataset-summary.view.svelte';
import { DatasetSnapshot } from "../../types";

// type of a function which generates a component given a snapshot
export type VisualizationGenerator = (snapshot: DatasetSnapshot) => Component;

export type StyleOptions = {
  scrollable: boolean,
  options: Map<string, string>,
}

export type Visualization = {
  generator: VisualizationGenerator,
  options?: StyleOptions,
}

export class DatasetSummary extends Component {
  title: string;
  selectMenu: Select;
  snapshotsService: Service<DatasetSnapshot>;
  visGenerators: VisualizationGenerator[];
  visOptions: StyleOptions[];
  currentVisualizations: Component[];

  constructor(snapshots: Service<DatasetSnapshot>, visualizations: Visualization[] = []) {
    super();
    this.title = 'Dataset summary';
    this.selectMenu = select([]);
    this.selectMenu.title = "choose a dataset";

    this.snapshotsService = snapshots;

    this.visGenerators = [];
    this.visOptions = [];

    for (let i = 0; i < visualizations.length; i++) {
      this.visGenerators.push(visualizations[i].generator);
      const opt = visualizations[i].options || { scrollable: false, options: new Map };
      this.visOptions.push(opt)
    }

    this.currentVisualizations = [];
    for (let i = 0; i < this.visGenerators.length; i++) {
      let text = marcelle.text("Nothing to see here 😶‍🌫️");
      text.title = "A visualization ...";
      this.currentVisualizations.push(text);
    }


    this.selectMenu.$value.subscribe(async (name) => {
      let snapshots = await this.snapshotsService.find({ filters: { name: name } }) as DatasetSnapshot[];
      if (snapshots == undefined || snapshots.length == 0) {
        console.log("No dataset named", name);
        return;
      }

      const snapshot = snapshots[0];

      // update the user's visualizations
      for (let i = 0; i < this.currentVisualizations.length; i++) {
        this.currentVisualizations[i].destroy();
        this.currentVisualizations[i] = this.visGenerators[i](snapshot);
        this.mountComponent(this.currentVisualizations[i], `visualization-mount-${i}`);
      }
    });

    this.updateSnapshots();
  }

  mountComponent(component: Component, targetTag: string): void {
    let root = document.getElementById(this.id);
    let target = root.getElementsByClassName(targetTag)[0];
    component.mount(target as HTMLElement);
  }

  async updateSnapshots(): Promise<void> {
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
        options: this.visOptions,
      },
    });
    this.mountComponent(this.selectMenu, "select-mount");
    this.currentVisualizations.forEach((vis, i) => this.mountComponent(vis, `visualization-mount-${i}`));
  }
}
