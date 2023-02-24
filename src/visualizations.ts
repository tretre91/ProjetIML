import { DatasetSnapshot } from "./types";
import * as marcelle from '@marcellejs/core';
import { ConfidencePlot, DatasetBrowser, GenericChart, Model, Stream } from "@marcellejs/core";
import { VisualizationGenerator } from "./components/dataset-summary/dataset-summary.component";

let counter = 0; // TODO: see if necessary

// generates a DatasetBrowser from a snapshot's instances
export function datasetBrowser(snapshot: DatasetSnapshot): DatasetBrowser {
  let dataset = marcelle.dataset(`tmp.${counter++}`, marcelle.dataStore());
  const file = new File([snapshot.instances], snapshot.name, { type: "application/json" });
  dataset.upload([file]);
  const browser = marcelle.datasetBrowser(dataset);
  return browser;
}

// Generates a line chart displaying the training accuracy for a snapshot
// @note This snapshot must use a model which provides this metric during its training
export function accuracyGraph(snapshot: DatasetSnapshot): GenericChart {
  let data = snapshot.training_metrics;
  let chart = marcelle.genericChart({
    preset: 'line',
    options: {
      xlabel: "Nb epoch",
      ylabel: "Accuracy",
    }
  });

  chart.title = "Accuracy graph";

  let acc_stream = new Stream<{ x: number, y: number }[]>(data.acc.map((acc: number, i: number) => { return { x: i, y: acc }; }));
  chart.addSeries(acc_stream, "Accuracy");

  let val_acc_stream = new Stream<{ x: number, y: number }[]>(data.accVal.map((acc: number, i: number) => { return { x: i, y: acc }; }));
  chart.addSeries(val_acc_stream, "Validation accuracy");

  return chart;
}

// Generates a line chart displaying the training loss for a snapshot
// @note This snapshot must use a model which provides this metric during its training
export function lossGraph(snapshot: DatasetSnapshot): GenericChart {
  let data = snapshot.training_metrics;
  let chart = marcelle.genericChart({
    preset: 'line',
    options: {
      xlabel: "Nb epoch",
      ylabel: "Loss",
    }
  });

  chart.title = "Loss graph";

  let lossStream = new Stream<{ x: number, y: number }[]>(data.loss.map((loss: number, i: number) => { return { x: i, y: loss }; }));
  chart.addSeries(lossStream, "Loss");

  let valLossStream = new Stream<{ x: number, y: number }[]>(data.lossVal.map((loss: number, i: number) => { return { x: i, y: loss }; }));
  chart.addSeries(valLossStream, "Validation loss");

  return chart;
}

// Returns a function which generates a confidence plot, given modelType (constructor),
// a datastore where models are stored and a feature stream
export function confidencePlot(store: marcelle.DataStore, modelType: () => Model<any, any>, dataStream: Stream<any>): VisualizationGenerator {
  return function(snapshot: DatasetSnapshot): ConfidencePlot {
    let model = modelType();
    model.load(store, snapshot.model_id);
    let $predictions = dataStream.map((features) => {
      return model.predict(features);
    })
      .awaitPromises();
    return marcelle.confidencePlot($predictions);
  }
}
