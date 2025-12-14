<script setup>
import UserProfileHeaderBg from '@images/pages/user-profile-header-bg.png'
import pages1 from '@images/pages/1.png'
</script>

<template>
  <VCol cols="12">
    <VCard>
      <VImg
        :src="UserProfileHeaderBg"
        cover
        max-height="250"
        min-height="125"
      />

      <VCardText class="d-flex align-bottom flex-sm-row flex-column justify-center gap-x-6">
        <div class="user-profile-info w-100 mt-16 pt-6 pt-sm-0 mt-sm-0">
          <h4 class="text-h4 text-center text-sm-start font-weight-medium mb-2">
            Digital Twin | PT. Kalbe Morinaga Indonesia
          </h4>

          <div class="d-flex align-center justify-center justify-sm-space-between flex-wrap gap-5">
            <div class="d-flex flex-wrap justify-center justify-sm-start flex-grow-1 gap-6">
              <span class="d-flex gap-x-2 align-center">
                <VIcon
                  icon="tabler-map-pin"
                  size="24"
                />
                <div class="text-body-1 font-weight-medium">
                  Jl. Raya Kawasan Industri Indotaisei, Sektor 1A, Blok Q1, Kalihurip, Cikampek, Karawang, West Java 41373
                </div>
              </span>

              <span class="d-flex gap-x-2 align-center">
                <VIcon
                  icon="tabler-calendar"
                  size="24"
                />
                <div class="text-body-1 font-weight-medium">
                  Development Initiated in 20 November 2025
                </div>
              </span>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VCol>
  <VCol
    cols="12"
    lg="4"
    md="4"
  >
    <VCard class="mt-5">
      <VImg
        :src="pages1"
        cover
      />

      <VCardItem>
        <VCardTitle>Manage Dashboard</VCardTitle>
      </VCardItem>

      <VCardText>
        Centralized control for dashboard configuration and customization.
      </VCardText>
      <VCardActions>
        <RouterLink to="system-settings/dashboard-settings">
          <VBtn>
            Manage
          </VBtn>
        </RouterLink>
      </VCardActions>
    </VCard>
  </VCol>
</template>

<style lang="scss">
.user-profile-avatar {
  border: 5px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface)) !important;
  inset-block-start: -3rem;

  .v-img__img {
    border-radius: 0.125rem;
  }
}
</style>
