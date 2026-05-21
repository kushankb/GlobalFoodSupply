<script>
  import { FOOD_GROUP_COLORS, INFRA_COLORS } from '$lib/layers/tilesetIds.js';

  let { breadbasketActive, infraActive = false, selectedFoodGroup = null, onSelectFoodGroup = () => {} } = $props();

  const foodGroups = Object.entries(FOOD_GROUP_COLORS);
  const infraEntries = Object.entries(INFRA_COLORS);

  function handleSwatchClick(key) {
    onSelectFoodGroup(selectedFoodGroup === key ? null : key);
  }
</script>

<!-- Bottom-right legend stack -->
<div class="legend-stack">
  <!-- Food Production Zones categorical legend -->
  {#if breadbasketActive}
    <div class="legend legend-categorical">
      <div class="legend-title">Food Production Zones</div>
      <div class="legend-swatches">
        {#each foodGroups as [key, { color, label }]}
          <div
            class="legend-swatch-row clickable {selectedFoodGroup && selectedFoodGroup !== key ? 'dimmed' : ''} {selectedFoodGroup === key ? 'selected' : ''}"
            onclick={() => handleSwatchClick(key)}
            title={selectedFoodGroup === key ? `Click to show all food groups` : `Click to show only ${label}`}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSwatchClick(key); }}
          >
            <span class="legend-swatch" style="background: {color}"></span>
            <span class="legend-swatch-label">{label}</span>
          </div>
        {/each}
      </div>
      <div class="legend-hint {selectedFoodGroup ? 'faded' : 'pulse'}">
        {selectedFoodGroup ? 'Click selected group to reset' : 'Click a food group to filter'}
      </div>
    </div>
  {/if}

  <!-- Infrastructure type legend -->
  {#if infraActive}
    <div class="legend legend-categorical">
      <div class="legend-title">Infrastructure Type</div>
      <div class="legend-swatches">
        {#each infraEntries as [type, { color }]}
          <div class="legend-swatch-row">
            <span class="legend-swatch legend-swatch-line" style="background: {color}"></span>
            <span class="legend-swatch-label">{type}</span>
          </div>
        {/each}
      </div>
      <div class="legend-hint faded">Opacity = food energy flow</div>
    </div>
  {/if}

</div>

<style>
  .legend-swatch-line {
    border-radius: 1px;
    height: 3px;
    width: 16px;
    align-self: center;
  }
</style>
