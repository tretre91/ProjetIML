import '@marcellejs/core/dist/marcelle.css';
import { dashboard, Dataset, dataStore, notification } from '@marcellejs/core';
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

// Components
const input = marcelle.webcam();
const labelInput = marcelle.textInput();
labelInput.title = "Instance label";

const capture = marcelle.button("Click to record an instance");
capture.title = "Capture instances to the training set";
const trainingButton = marcelle.button("Train");
const saveButton = marcelle.button("Save dataset")
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

trainingButton.$click.subscribe(() => { classifier.train(dataset); });


/**
 * @brief Creates a snaphsot from a dataset
 * @param targets A list of components which will need to be updated after
 * @return a Promise<void>
 */
async function createSnapshot(name: string, dataset: Dataset<any>, targets: (DatasetSummary)[]): Promise<void> {
  dataset.items()
    .toArray()
    .then((instances) => {
      const data = {
        marcelleData: {
          type: "dataset",
        },
        instances: instances,
      };
      return snapshotService.create({ name: name, data: JSON.stringify(data) });
    })
    .then(() => {
      for (const target of targets) {
        target.updateDatasets();
      }
      console.log("Updated datasets");
    });
}

// Custom components used to display info about a snapshot
const summaryA = datasetSummary(snapshotService);
const summaryB = datasetSummary(snapshotService);

saveButton.$click.subscribe(async () => {
  let snapshotName = saveNameInput.$value.get();
  if (snapshotName.trim() == "") {
    notification({
      title: "Error",
      message: "You need to give your snapshot a name",
    });
    return;
  }
  await createSnapshot(snapshotName, dataset, [summaryA, summaryB]);
});

// Pages
const dash = dashboard({
  title: 'Project demo!',
  author: 'Cyril Dubos, Brice Pointal, Trévis Morvany',
});

dash
  .page('Welcome')
  .sidebar(input, capture, featureExtractor)
  .use(labelInput, datasetBrowser)
  .use([saveNameInput, saveButton]);

// Dataset comparison page
let comparePage = dash.page("Dataset comparison");
comparePage.showSidebar = false;

comparePage.use([summaryA, summaryB]);


let predictionsPage = dash.page("Dataset predictions");


dash.show();
