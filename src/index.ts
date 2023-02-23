import '@marcellejs/core/dist/marcelle.css';
import { dashboard, Dataset, dataStore, GenericChart, notification, Stream } from '@marcellejs/core';
import * as marcelle from '@marcellejs/core'
import { SnapshotService } from './snapshot-service';
import { DatasetSummary, datasetSummary } from './components';
import { DatasetSnapshot } from "./types";


// Storage

// const storage = dataStore('localStorage');
const storage = dataStore();
storage.feathers.use("snapshots-service", new SnapshotService(storage.service("")));
const snapshotService = storage.service<DatasetSnapshot>("snapshots-service");


// Classifier things
const featureExtractor = marcelle.mobileNet();
const classifier = marcelle.mlpClassifier({ layers: [32, 32], epochs: 20 });
const dataset = marcelle.dataset("TrainingSet", storage);
var datasetBrowser = marcelle.datasetBrowser(dataset);
const params = marcelle.modelParameters(classifier);

// Components
const input = marcelle.webcam();
const labelInput = marcelle.textInput();
labelInput.title = "Instance label";

const capture = marcelle.button("Click to record an instance");
capture.title = "Capture instances to the training set";
const trainingButton = marcelle.button("Train the model");
trainingButton.title = "Train";
const trainingStatus = marcelle.trainingProgress(classifier);
const saveNameInput = marcelle.textInput();
saveNameInput.title = "Snapshot name";

input.$images
  .filter(() => { return capture.$pressed.get(); })
  .map(async (img) => ({
    x: await featureExtractor.process(img),
    y: labelInput.$value.get(),
    thumbnail: input.$thumbnails.get(),
  }))
  .awaitPromises()
  .subscribe(dataset.create);

var snapshotName: string;

trainingButton.$click.subscribe(() => {
  snapshotName = saveNameInput.$value.get().trim();// TODO: handle empty
  if (snapshotName == "") {
    notification({
      title: "Error",
      message: "You need to give your snapshot a name",
    });
  } else {
    classifier.train(dataset);
  }
});


/**
 * @brief Creates a snaphsot from a dataset
 * @param targets A list of components which will need to be updated after
 * @return a Promise<void>
 */
async function createSnapshot(name: string, dataset: Dataset<any>, model_id: string, metrics: Object, targets: (DatasetSummary)[]): Promise<void> {
  dataset.items()
    .toArray()
    .then((instances) => {
      const data = {
        marcelleData: {
          type: "dataset",
        },
        instances: instances,
      };
      return snapshotService.create({
        name: name,
        instances: JSON.stringify(data),
        model_id: model_id,
        training_metrics: metrics,
      });
    })
    .then(() => {
      for (const target of targets) {
        target.updateDatasets();
      }
      console.log("Updated datasets");
    });
}

classifier.$training.subscribe(async (status) => {
  if (status.status == "success") {
    const model_id = await classifier.save(storage, snapshotName + "_model");
    createSnapshot(snapshotName, dataset, model_id, status.data, [summaryA, summaryB]);
  }
  console.log(status);
});

// TODO: create a module for predefined visualizations
let accGraphGenerator = function(snapshot: DatasetSnapshot): GenericChart {
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

let lossGraphGenerator = function(snapshot: DatasetSnapshot): GenericChart {
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

// Custom components used to display info about a snapshot
const summaryA = datasetSummary(snapshotService, [accGraphGenerator, lossGraphGenerator]);
const summaryB = datasetSummary(snapshotService, [accGraphGenerator, lossGraphGenerator]);

// Pages
const dash = dashboard({
  title: 'Project demo!',
  author: 'Cyril Dubos, Brice Pointal, Trévis Morvany',
});

dash
  .page('Welcome')
  .sidebar(input, capture, featureExtractor)
  .use([labelInput, saveNameInput], datasetBrowser)
  .use([params, trainingButton])
  .use(trainingStatus);

// Dataset comparison page
let comparePage = dash.page("Dataset comparison");
comparePage.showSidebar = false;

comparePage.use([summaryA, summaryB]);


let predictionsPage = dash.page("Dataset predictions");


dash.show();
