<script setup>
import { useManageAuthentication } from "@/composables/useManageAuthentication"
import { parseJwt } from "@core/utils/helpers.js"
import avatar1 from '@images/avatars/avatar-1.png'
import { watch } from "vue"

const rawJwt = ref('')

onMounted(() => {
  rawJwt.value = useCookie('access_token').value
})

const {
  handleLogout,  
} = useManageAuthentication()

const parsedJwt = computed(() => {
  return parseJwt(rawJwt.value)
})

const avatarPath = ref('')

watch(parsedJwt, () => {
  if(!parsedJwt.value) return null
  avatarPath.value =  parsedJwt.value.avatar_path === '' ? avatar1 : useStaticFile(parsedJwt.value.avatar_path) 
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
      <VImg :src="avatarPath" />

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
                    <VImg :src="avatarPath" />
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

            <VListItemTitle>
              Profile
            </VListItemTitle>
          </VListItem>
          <VListItem
            class="text-white"
            link
            to="/faqs"
          >
            <template #prepend>
              <VIcon
                class="me-2 text-white"
                icon="tabler-bubble-text"
                size="22"
              />
            </template>

            <VListItemTitle>
              FAQ
            </VListItemTitle>
          </VListItem>


          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem @click="handleLogout">
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
