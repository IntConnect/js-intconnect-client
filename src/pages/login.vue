<script setup>
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import conveyorLoginIsometric from '@images/pages/conveyor-login-isometric.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { useManageAuthentication } from "@/composables/useManageAuthentication.js"
import GeneralAlert from "@/components/general/GeneralAlert.vue"
import AlertDialog from "@/components/dialogs/AlertDialog.vue"

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const form = ref({
  user_identifier: '',
  password: '',
})

const isPasswordVisible = ref(false)
const authThemeImg = useGenerateImageVariant(conveyorLoginIsometric, conveyorLoginIsometric, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const {
  handleLogin,
  formErrors,
  errorMessage,
} = useManageAuthentication()

const showAlertDialog = ref(false)
const alertMessage = ref('')

const route = useRoute()
const router = useRouter()


onMounted(() => {
  if (route.query.alert === 'session_expired') {
    showAlertDialog.value = true
    alertMessage.value = 'Your session has expired, please login again.'
  } else if (route.query.alert === 'not_login') {
    showAlertDialog.value = true
    alertMessage.value = 'You are not login yet.'
  }
  router.replace({ query: {} })

})
</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </a>

  <VRow
    class="auth-wrapper bg-surface"
    no-gutters
  >
    <VCol
      class="d-none d-md-flex"
      md="8"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 6.25rem;"
        >
          <VImg
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
            max-width="613"
          />
        </div>

        <img
          :src="authThemeMask"
          alt="auth-footer-mask"
          class="auth-footer-mask flip-in-rtl"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      class="auth-card-v2 d-flex align-center justify-center"
      cols="12"
      md="4"
    >
      <VCard
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
        flat
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>
        <VCardText>
          <VForm @submit.prevent="handleLogin(form)">
            <VRow>
              <VCol cols="12">
                <GeneralAlert
                  v-if="errorMessage"
                  :description="errorMessage"
                  color="error"
                  icon="tabler-bug"
                />
              </VCol>

              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.user_identifier"
                  :error="!!formErrors.user_identifier"
                  :error-messages="formErrors.user_identifier"
                  autofocus
                  label="Email or Username"
                  placeholder="johndoe@email.com"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error="!!formErrors.password"
                  :error-messages="formErrors.password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  label="Password"
                  placeholder="············"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-6" />

                <VBtn
                  block
                  type="submit"
                >
                  Login
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
