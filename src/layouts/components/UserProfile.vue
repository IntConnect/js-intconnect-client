<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import { parseJwt } from "@core/utils/helpers.js"

const rawJwt = ref('')

onMounted(() => {
  rawJwt.value = useCookie('access_token').value
})

const parsedJwt = computed(() => {
  return parseJwt(rawJwt.value)
})
</script>

<template>
  <VBadge
    bordered
    color="success"
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg :src="avatar1" />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        location="bottom end"
        offset="14px"
        width="230"
      >
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  color="success"
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ parsedJwt.name }}
            </VListItemTitle>
            <VListItemSubtitle>
              {{ parsedJwt.role_name }}
            </VListItemSubtitle>
          </VListItem>

          <VDivider class="my-2" />


          <VListItem
            class="text-white"
            link
            to="/users/profile"
          >
            <template #prepend>
              <VIcon
                class="me-2 text-white"
                icon="tabler-user"
                size="22"
              />
            </template>

            <VListItemTitle class="text-white">
              Profile
            </VListItemTitle>
          </VListItem>


          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem to="/login">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-logout"
                size="22"
              />
            </template>

            <VListItemTitle>Logout</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
