<script setup>
import avatar4 from '@images/avatars/avatar-4.png';

const solidCardData = [
  {
    cardBg: '#72BF6A',
    title: 'Machine Status',
    icon: 'tabler-brand-twitter',
    text: '"Turns out semicolon-less style is easier and safer in TS because most gotcha edge cases are type invalid as well."',
    avatarImg: avatar4,
    avatarName: 'Mary Vaughn',
    likes: '1.2k',
    share: '80',
  },
]
</script>

<template>
  <VRow>
    <VCol
      v-for="data in solidCardData"
      :key="data.icon"
      cols="12"
      md="12"
      lg="12"
    >
      <VCard :color="data.cardBg">
        <VCardItem>
          <VCardTitle
            class="text-white wrap-title"
            style="font-size: 1.1rem; line-height: 1;"
          >
            {{ data.title }}
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h1
            class="text-white mb-0 font-weight-bold"
            style="font-size: 5rem; line-height: 1;"
          >
            ON
          </h1>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="css" scoped>
    .wrap-title {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  word-break: break-word;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
}
</style>
