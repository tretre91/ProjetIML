<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { ViewContainer } from '@marcellejs/design-system';
  import { Row } from './dataset-list.component';

  export let title: string;
  export let rows: Row[];
  export let setup: () => void;
  export let refreshList: () => void;
  export let select: (i: number, v: boolean) => void;

  export function selectAll(checkbox: HTMLInputElement) {
    for (let i = 0; i < rows.length; i++) {
      select(i, checkbox.checked);
      rows[i].selected = checkbox.checked;
    }
    console.log(rows);
  }

  onMount(setup);
  afterUpdate(refreshList);
</script>

<ViewContainer {title}>
  <div id="snapshots">
    <input class="search" placeholder="Search..." />
    <button class="sort" data-sort="name">Sort by name</button>
    <button class="sort" data-sort="creation-time">Sort by date</button>

    <table>
      <thead>
        <tr>
          <th>
            <input type="checkbox" on:change={(e) => selectAll(e.currentTarget)} />
          </th>
          <th>Name</th>
          <th>Created at</th>
        </tr>
      </thead>
      <tbody class="list">
        <tr hidden={true}>
          <td>
            <input type="checkbox" />
          </td>
          <td class="name" />
          <td class="creation-time" />
        </tr>
        {#each rows as { name, timestamp, selected }, i}
          <tr>
            <td>
              {#if selected}
                <input
                  type="checkbox"
                  bind:checked={selected}
                  on:change={(e) => select(i, e.currentTarget.checked)}
                />
              {:else}
                <input type="checkbox" on:change={(e) => select(i, e.currentTarget.checked)} />
              {/if}
            </td>
            <td class="name">{name}</td>
            <td class="creation-time"
              >{timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString()}</td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</ViewContainer>

<style>
  .list {
    font-family: sans-serif;
  }
  table {
    border: solid 1px #eee;
    width: 100%;
    border-collapse: collapse;
  }
  thead {
    background-color: #eee;
  }
  tr {
    border: solid;
    border-width: 1px 0;
  }
  td {
    text-align: center;
    padding: 10px;
    border: solid 1px #eee;
  }

  input {
    border: solid 1px #ccc;
    border-radius: 5px;
    padding: 7px 14px;
    margin-bottom: 10px;
  }
  input:focus {
    outline: none;
    border-color: #aaa;
  }
  .sort {
    padding: 8px 30px;
    border-radius: 6px;
    border: none;
    display: inline-block;
    color: #fff;
    text-decoration: none;
    background-color: #28a8e0;
    height: 30px;
  }
  .sort:hover {
    text-decoration: none;
    background-color: #1b8aba;
  }
  .sort:focus {
    outline: none;
  }
  .sort:after {
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid transparent;
    content: '';
    position: relative;
    top: -10px;
    right: -5px;
  }
  .sort.asc:after {
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #fff;
    content: '';
    position: relative;
    top: 4px;
    right: -5px;
  }
  .sort.desc:after {
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid #fff;
    content: '';
    position: relative;
    top: -4px;
    right: -5px;
  }
</style>
