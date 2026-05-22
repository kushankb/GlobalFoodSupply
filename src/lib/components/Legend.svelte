<script>
  import { FOOD_GROUP_COLORS } from '$lib/layers/tilesetIds.js';

  let { breadbasketActive, infraActive = false, selectedFoodGroup = null, onSelectFoodGroup = () => {} } = $props();

  const foodGroups = Object.entries(FOOD_GROUP_COLORS);

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

  <!-- Infrastructure criticality legend -->
  {#if infraActive}
    <div class="legend">
      <div class="legend-title">Infrastructure Criticality</div>
      <div class="legend-gradient" style="background: linear-gradient(to right, rgba(220,155,75,0.07), rgba(220,155,75,1))"></div>
      <div class="legend-labels">
        <span>Low</span><span>High</span>
      </div>
      <div class="legend-hint faded">Brightness + width = quantity rank</div>
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
