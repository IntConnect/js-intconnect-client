<script setup>
import navItems from '@/navigation/horizontal'
import { themeConfig } from '@themeConfig'

// Components
import { useManageUser } from '@/composables/useManageUser'
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'
import { HorizontalNavLayout } from '@layouts'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { nextTick } from 'vue'

const rawJwt = ref('')
const userPermissions = ref([])

const {
  user,
  fetchProfile,
} = useManageUser()


const parsedJwt = computed(() => {
  return parseJwt(rawJwt.value)
})

const hasPermission = requiredPermission => {
  if (!requiredPermission) return true // jika menu tidak memerlukan permission
  
  return userPermissions.value?.includes(requiredPermission)
}

onMounted(async () => {
  rawJwt.value = useCookie('access_token').value
  console.log(rawJwt.value)
  if (rawJwt.value !== undefined && rawJwt.value !== "") {
    await fetchProfile()
    await nextTick()
    userPermissions.value = user.value.entry?.role?.permissions.map(permission => {
      return permission.code
    })
  }
})

const filteredNavItems = computed(() => {
  return navItems
    .map(item => {
      if (!hasPermission(item.requiredPermission)) return null

      if (item.children) {
        const allowedChildren = item.children.filter(child => hasPermission(child.requiredPermission))
        if (!allowedChildren.length) return null
        
        return { ...item, children: allowedChildren }
      }

      return item
    })
    .filter(Boolean)
})
</script>

<template>
  <HorizontalNavLayout :nav-items="filteredNavItems">
    <!-- 👉 navbar -->
    <template #navbar>
      <RouterLink
        to="/"
        class="app-logo d-flex align-center gap-x-3"
      >
        <VNodeRenderer :nodes="themeConfig.app.logo" />

        <h1 class="app-title font-weight-bold leading-normal text-xl text-capitalize">
          {{ themeConfig.app.title }}
        </h1>
      </RouterLink>
      <VSpacer />

      <NavBarI18n
        v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
        :languages="themeConfig.app.i18n.langConfig"
      />

      <NavbarThemeSwitcher class="me-2" />
      <UserProfile v-if="rawJwt" />
      <VBtn
        v-else
        color="primary"
        to="/login"
        style="pointer-events: all;"
      >
        Login
        <VIcon
          end
          icon="tabler-login-2"
        />
      </VBtn>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <!-- <TheCustomizer /> -->
  </HorizontalNavLayout>
</template>
