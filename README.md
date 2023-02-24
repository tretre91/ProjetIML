# Interactive Machine Learning project 

> A [Marcelle](https://marcelle.dev) Application

A set of marcelle components and functions which enable the user to better iterate on their data.

Some visuals are shown in the [slides](./slides.pdf).

## Available Scripts

### npm run dev

Runs the app in the development mode.
Open http://localhost:3000 to view it in the browser.

The page will reload if you make edits.

### npm run build

Builds a static copy of your site to the `dist/` folder.
Your app is ready to be deployed!

## Key objects

- `DatasetSnapshot`: A type for snapshots of a dataset, which contains the instances and (a pointer to) the associated model. It is defined as follows:
  ```typescript
  type StoredObject = {
    id: string,
    createdAt: string,
    updatedAt: string
  }

  type DatasetSnapshot = StoredObject & {
    name: string;
    instances: string;
    model_id: string;
    training_metrics: any;
  }
  ```
- `DatasetSummary`: A marcelle component which associates a select menu for the snapshots and user provided visualizations
  One can apply css style options on these visualizations.
- Visualization generators: Functions provided as arguments to the DatasetSummary by the user, these functions generate a marcelle Component from a snapshot.
  Some predefined generators can be found in the [`visualizations`](./src/visualizations.ts) module.
- `DatasetList`: A list of snapshot which allows for searching through the snapshots, deleting some, and loading instances from a snapshot. It uses [list.js](https://listjs.com/).

## Known bugs

| bug                                                                           | note                                                                     |
|-------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| Notifications are not displayed                                               | We don't know why...                                                     |
| Stored models are not deleted alongside the snapshot which refers to them     |                                                                          |
| The "Dataset Management" page doesn't load when we open it for the first time | Just go to another page and go back to this page for the list to display |
| The list is not updated after a deletion                                      | Same as above                                                            |

## Possible improvements

- Use a change history instead of storing each dataset
- Add more management options: renaming, merge
- Maybe separate the data from the model

