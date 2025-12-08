<script setup>
import { useRoute } from 'vue-router'
import avatar1 from '@images/avatars/avatar-1.png'


// Composable
const {
  user,
  fetchUser,
  error,
  loading,
  updateProfile,
  actionLoading,
  formErrors,
  clearFormErrors,
  clearErrors,
} = useManageUser()

// ======================================================
// FORM STATE
// ======================================================
const formData = ref({
  name: '',
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  avatar: null,
})

const parsedJwtToken = ref({})

const avatarPreview = ref(avatar1)

const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// ======================================================
// LIFECYCLE
// ======================================================
onMounted(async () => {
  const accessToken = useCookie('access_token').value

  parsedJwtToken.value = parseJwt(accessToken)
  await nextTick()
  await fetchUser(parsedJwtToken.value.id)

  if (user.value) {
    formData.value.name = user.value.entry.name
    formData.value.username = user.value.entry.username
    formData.value.email = user.value.entry.email
    avatarPreview.value = user.value.entry.avatar_path === '' ? avatar1 : user.value.entry.avatar_path == ''
  }
})

// ======================================================
// AVATAR HANDLER
// ======================================================
const refInputEl = ref()

const changeAvatar = event => {
  const file = event.target.files[0]
  if (!file) return

  formData.value.avatar = file

  const reader = new FileReader()

  reader.onload = e => {
    avatarPreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const resetAvatar = () => {
  avatarPreview.value = user.value?.avatar ?? avatar1
  formData.value.avatar = null
}

// ======================================================
// FORM SUBMIT
// ======================================================
const refForm = ref()
const isFormValid = ref(true)

const onSubmit = async () => {
  clearFormErrors()

  const payload = new FormData()

  payload.append('name', formData.value.name)
  payload.append('username', formData.value.username)
  payload.append('email', formData.value.email)

  payload.append('current_password', formData.value.currentPassword)
  if (formData.value.newPassword)
    payload.append('new_password', formData.value.newPassword)

  if (formData.value.confirmPassword)
    payload.append('confirm_password', formData.value.confirmPassword)

  if (formData.value.avatar)
    payload.append('avatar', formData.value.avatar)

  await updateProfile(payload)
  console.log(formErrors)
}

const resetForm = () => {
  refForm.value?.reset()
  refForm.value?.resetValidation()

  // Reload original data
  if (user.value) {
    formData.value.name = user.value.name
    formData.value.username = user.value.username
    formData.value.email = user.value.email
    avatarPreview.value = user.value.avatar ?? avatar1

    formData.value.currentPassword = ''
    formData.value.newPassword = ''
    formData.value.confirmPassword = ''
  }
}
</script>

<template>
  <VRow>
    <VCol cols="6">
      <!-- 👉 Table -->
      <VCard title="Recent Activity">
        <VDivider />

        <VDataTable
          :headers="recentDevicesHeaders"
          :items="recentDevices"
          class="text-no-wrap"
          hide-default-footer
        >
          <template #item.browser="{ item }">
            <div class="d-flex">
              <VIcon
                :color="item.deviceIcon.color"
                :icon="item.deviceIcon.icon"
                size="22"
                start
              />
              <div class="text-high-emphasis text-body-1 font-weight-medium">
                {{ item.browser }}
              </div>
            </div>
          </template>
          <!-- TODO Refactor this after vuetify provides proper solution for removing default footer -->
          <template #bottom />
        </VDataTable>
      </VCard>
    </VCol>
    <VCol cols="6">
      <VCard>
        <VCardText class="d-flex">
          <!-- Avatar -->
          <VAvatar
            :image="avatarPreview"
            class="me-6"
            rounded
            size="100"
          />

          <!-- Upload Avatar -->
          <form class="d-flex flex-column justify-center gap-4">
            <div class="d-flex flex-wrap gap-4">
              <VBtn
                color="primary"
                size="small"
                @click="refInputEl?.click()"
              >
                <VIcon
                  class="d-sm-none"
                  icon="tabler-cloud-upload"
                />
                <span class="d-none d-sm-block">Upload new photo</span>
              </VBtn>

              <input
                ref="refInputEl"
                accept=".jpeg,.png,.jpg,GIF"
                hidden
                name="file"
                type="file"
                @input="changeAvatar"
              >

              <VBtn
                color="secondary"
                size="small"
                variant="tonal"
                @click="resetAvatar"
              >
                <span class="d-none d-sm-block">Reset</span>
                <VIcon
                  class="d-sm-none"
                  icon="tabler-refresh"
                />
              </VBtn>
            </div>

            <p class="text-body-1 mb-0">
              Allowed JPG, GIF or PNG. Max size of 800K
            </p>
          </form>
        </VCardText>

        <VCardText class="pt-2">
          <VForm
            ref="refForm"
            v-model="isFormValid"
            class="mt-3"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- Name -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.name"
                  :error="!!formErrors.name"
                  :error-messages="formErrors.name"
                  label="Name"
                  placeholder="John Doe"
                />
              </VCol>

              <!-- Username -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.username"
                  :error="!!formErrors.username"
                  :error-messages="formErrors.username"
                  label="Username"
                  placeholder="johndoe"
                />
              </VCol>

              <!-- Email -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.email"
                  :error="!!formErrors.email"
                  :error-messages="formErrors.email"
                  label="Email"
                  placeholder="johndoe@gmail.com"
                />
              </VCol>

              <!-- Current Password -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.currentPassword"
                  :append-inner-icon="isCurrentPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error="!!formErrors.current_password"
                  :error-messages="formErrors.current_password"
                  :type="isCurrentPasswordVisible ? 'text' : 'password'"
                  autocomplete="on"
                  label="Current Password"
                  placeholder="············"
                  @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible"
                />
              </VCol>

              <!-- New Password -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.newPassword"
                  :append-inner-icon="isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error="!!formErrors.newPassword"
                  :error-messages="formErrors.newPassword"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  autocomplete="on"
                  label="New Password (Optional)"
                  placeholder="············"
                  @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                />
              </VCol>

              <!-- Confirm Password -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="formData.confirmPassword"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error="!!formErrors.confirmPassword"
                  :error-messages="formErrors.confirmPassword"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  autocomplete="on"
                  label="Confirm New Password (Optional)"
                  placeholder="············"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>

              <!-- Action Buttons -->
              <VCol
                class="d-flex flex-wrap gap-4"
                cols="12"
              >
                <VBtn
                  :loading="actionLoading"
                  type="submit"
                >
                  Save changes
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="tonal"
                  @click.prevent="resetForm"
                >
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
