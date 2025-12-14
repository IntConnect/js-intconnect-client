<script setup>
const sourceVisits = [
  {
    avatarIcon: 'tabler-gauge',
    title: 'Energy Efficiency',
    subtitle: 'kW per TR',
    stats: '0.456 kW/TR',
    profitLoss: -0.344, // improvement from baseline
  },
  {
    avatarIcon: 'tabler-bolt',
    title: 'Energy Consumption',
    subtitle: 'Total Power Usage',
    stats: '233,344 kWh',
    profitLoss: -30234,
  },
  {
    avatarIcon: 'tabler-snowflake',
    title: 'Cooling Load',
    subtitle: 'Total TR-Hours',
    stats: '520,610 TR-hr',
    profitLoss: 175922, // increased load
  },
  {
    avatarIcon: 'tabler-currency-dollar',
    title: 'Cost Savings',
    subtitle: 'Operational Savings',
    stats: '$25,668',
    profitLoss: 3312,
  },
  {
    avatarIcon: 'tabler-leaf',
    title: 'CO₂ Reduction',
    subtitle: 'Carbon Emission Saved',
    stats: '24 tons',
    profitLoss: 0,
  },
]
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>Realtime Stats</VCardTitle>
      <VCardSubtitle />
    </VCardItem>

    <VCardText>
      <VList class="card-list">
        <VListItem
          v-for="visit in sourceVisits"
          :key="visit.title"
        >
          <template #prepend>
            <VAvatar
              class="me-1"
              color="secondary"
              rounded
              size="38"
              variant="tonal"
            >
              <VIcon
                :icon="visit.avatarIcon"
                size="22"
              />
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-medium me-4">
            {{ visit.title }}
          </VListItemTitle>
          <VListItemSubtitle class="me-4">
            {{ visit.subtitle }}
          </VListItemSubtitle>

          <template #append>
            <div class="d-flex align-center gap-x-4">
              <div class="text-body-1">
                {{ visit.stats }}
              </div>
              <VChip
                :color="visit.profitLoss > 0 ? 'success' : 'error'"
                label
                size="small"
              >
                {{ visit.profitLoss > 0 ? '+' : '' }}
                {{ visit.profitLoss }}%
              </VChip>
            </div>
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}
</style>
