<template>
  <VSelect
    v-model="itemsPerPage"
    :items="ITEMS_PER_PAGE_OPTIONS"
    item-title="title"
    item-value="value"
    label="Items per page"
  />
</template>
