<script lang="ts">
  import { ViewContainer } from '@marcellejs/design-system';
  import { VisualizationGenerator } from './dataset-summary.component';

  export let title: string;
  export let visualizations: VisualizationGenerator[];
</script>

<ViewContainer {title}>
  <div class="select-mount" />
  <hr />
  <scrollArea>
    <div class="browser-mount" />
  </scrollArea>
  {#each visualizations as _, i}
    <hr />
    <div class="visualization-mount-{i}" />
  {/each}
</ViewContainer>

<style>
  scrollArea {
    height: 300px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 5px;
  }
  hr {
    width: 100%;
  }
</style>
