<script lang="ts">
  import { ViewContainer } from '@marcellejs/design-system';
  import { StyleOptions } from './dataset-summary.component';

  export let title: string;
  export let options: StyleOptions[];

  export function getStyle(opt: StyleOptions): string {
    let style = '';
    for (const [key, value] of opt.options) {
      style += `${key}: ${value}`;
    }
    return style + ';';
  }
</script>

<ViewContainer {title}>
  <div class="select-mount" />
  {#each options as opt, i}
    <hr />
    {#if opt.scrollable}
      <scrollArea class="visualization-mount-{i}" style={getStyle(opt)} />
    {:else}
      <div class="visualization-mount-{i}" style={getStyle(opt)} />
    {/if}
  {/each}
</ViewContainer>

<style>
  scrollArea {
    overflow-x: hidden;
    overflow-y: auto;
    padding: 5px;
  }
  hr {
    width: 100%;
  }
</style>
