import '@marcellejs/core/dist/marcelle.css';
import { dashboard, Dataset, dataStore, notification } from '@marcellejs/core';
import * as marcelle from '@marcellejs/core'
import { SnapshotService } from './snapshot-service';
import { datasetList, DatasetSummary, datasetSummary } from './components';
import { DatasetSnapshot } from "./types";
import * as viz from "./visualizations";
import { Visualization } from './components/dataset-summary/dataset-summary.component';


// Storage

const storage = dataStore('localStorage');
// const storage = dataStore();
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

const capture = marcelle.button("Click and hold to record instances");
capture.title = "Capture instances to the training set";

const clearButton = marcelle.button("Clear instances");
clearButton.title = "Clear";
clearButton.$click.subscribe(() => {
  dataset.clear();
});

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
        target.updateSnapshots();
      }
      console.log("Updated datasets");
    });
}

classifier.$training.subscribe(async (status) => {
  if (status.status == "success") {
    const model_id = await classifier.save(storage, snapshotName + "_model");
    await createSnapshot(snapshotName, dataset, model_id, status.data, [summaryA, summaryB, predictionA, predictionB]);
    notification({
      title: "Snapshot creation",
      message: `Successfuly created snapshot '${snapshotName}'`,
    });
  }
  console.log(status);
});

// Pages
const dash = dashboard({
  title: 'Project demo!',
  author: 'Cyril Dubos, Brice Pointal, Trévis Morvany',
});

dash
  .page('Welcome')
  .sidebar(input, capture, featureExtractor)
  .use([labelInput, saveNameInput, clearButton], datasetBrowser)
  .use([params, trainingButton])
  .use(trainingStatus);

// Dataset comparison page
let comparePage = dash.page("Dataset Comparison");
comparePage.showSidebar = false;

// Custom components used to display info about a snapshot
let visualizations: Visualization[] = [
  {
    generator: viz.datasetBrowser,
    options: {
      scrollable: true,
      options: new Map([["height", "400px"]]),
    },
  },
  { generator: viz.accuracyGraph, },
  { generator: viz.lossGraph, },
];

const summaryA = datasetSummary(snapshotService, visualizations);
const summaryB = datasetSummary(snapshotService, visualizations);

comparePage.use([summaryA, summaryB]);

// Snapshot prediction page
let predictionsPage = dash.page("Predictions");

let $images = input.$images
  .map((img) => {
    return featureExtractor.process(img);
  })
  .awaitPromises();

let mlpConfidencePlot = viz.confidencePlot(storage, marcelle.mlpClassifier, $images);
let predictionA = datasetSummary(snapshotService, [{ generator: mlpConfidencePlot }]);
let predictionB = datasetSummary(snapshotService, [{ generator: mlpConfidencePlot }]);

predictionsPage
  .sidebar(input)
  .use([predictionA, predictionB]);

let managementPage = dash.page("Dataset Management");
managementPage.showSidebar = false;

let snapshotsList = datasetList(snapshotService);
const deleteButton = marcelle.button("Delete selected datasets");
deleteButton.title = "Delete";
deleteButton.$type.set("danger");
deleteButton.$click.subscribe(() => snapshotsList.deleteSelected());

managementPage
  .use(snapshotsList, deleteButton);

dash.show();
