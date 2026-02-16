<script setup>
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"
import { nextTick, onMounted, ref, watch } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  formErrors: {
    type: Object,
    default: () => ({}),
  },
  userData: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
  'close',
])

// ==========================================
// Form State
// ==========================================
const isFormValid = ref(false)
const refForm = ref()

// Form fields
const id = ref('')
const username = ref('')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const roleId = ref('')

const isAlertDialogVisible = ref(false)
const bodyAlert = ref('')
const titleAlert = ref('')
const alertType = ref('info')

// Password visibility
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// ==========================================
// Computed
// ==========================================
const isEditMode = computed(() => Boolean(id.value))

const passwordRules = computed(() => {
  // Password required only for create mode
  return isEditMode.value ? [] : [requiredValidator]
})

// ==========================================
// Methods
// ==========================================

/**
 * Close drawer and reset form
 */
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  emit('close')

  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
  })
}

/**
 * Handle form submission
 */
const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (!valid) return

    // Validate password match (only if password is provided)
    if (password.value && password.value !== confirmPassword.value) {
    isAlertDialogVisible.value = true
    bodyAlert.value = 'Password do not match'
    titleAlert.value = 'Input not valid'
    alertType.value = 'error'

      return
    }

    // Prepare user data
    const userData = {
      username: username.value,
      name: name.value,
      email: email.value,
      role_id: roleId.value,
    }

    // Include id for update
    if (id.value) {
      userData.id = id.value
    }

    // Include password if provided (required for create, optional for update)
    if (password.value) {
      userData.password = password.value
    }

    emit('userData', userData)
  })
}

const processedRoles = ref([])

const {
  roles,
  fetchRoles,
} = useManageRole()

onMounted(async () => {
  await fetchRoles()
  await nextTick()
  processedRoles.value = roles.value.entries.map(role => ({
    title: role.name,
    value: role.id,
  }))
  roleId.value = processedRoles.value[0]['value']
})


// ==========================================
// Watchers
// ==========================================

/**
 * Watch for userData changes (for edit mode)
 */
watch(
  () => props.userData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      username.value = val.username || ''
      name.value = val.name || ''
      email.value = val.email || ''
      roleId.value = val.role?.id || ''

      // Clear password fields for edit mode
      password.value = ''
      confirmPassword.value = ''
    }
  },
  { immediate: true, deep: true },
)

/**
 * Watch drawer close to reset form
 */
watch(
  () => props.isDrawerOpen,
  isOpen => {
    if (!isOpen) {
      nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
      })
    }
  },
)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  fetchRoles()
})

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
}
</script>

<template>
  <VNavigationDrawer
    :model-value="props.isDrawerOpen"
    :width="400"
    class="scrollable-content"
    location="end"
    temporary
    @update:model-value="handleDrawerModelValueUpdate"
    data-testid="user-drawer"
  >
    <!-- Header -->
    <AppDrawerHeaderSection
      title="Manage User"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- Username -->
              <VCol cols="12">
                <AppTextField
                  v-model="username"
                  :error="!!props.formErrors.username"
                  :error-messages="props.formErrors.username"
                  :rules="[requiredValidator]"
                  label="Username"
                  placeholder="johndoe"
                />
              </VCol>

              <!-- Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="name"
                  :error="!!props.formErrors.name"
                  :error-messages="props.formErrors.name || []"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="John Doe"
                />
              </VCol>

              <!-- Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="email"
                  :error="!!props.formErrors.email"
                  :error-messages="props.formErrors.email || []"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="johndoe@email.com"
                />
              </VCol>

              <!-- Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error="!!props.formErrors.password"
                  :error-messages="props.formErrors.password"
                  :label="isEditMode ? 'New Password (optional)' : 'Password'"
                  :rules="passwordRules"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  placeholder="••••••••"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  data-testid="password-field"
                />
                <div
                  v-if="isEditMode"
                  class="text-caption text-disabled mt-1"
                >
                  Leave empty to keep current password
                </div>
              </VCol>

              <!-- Confirm Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="confirmPassword"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error-messages="props.formErrors.confirmPassword || []"
                  :rules="passwordRules"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  label="Confirm Password"
                  placeholder="••••••••"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  data-testid="confirm-password-field"

                />
              </VCol>

              <!-- Role -->
              <VCol cols="12">
                <AppSelect
                  v-model="roleId"
                  :error="!!props.formErrors.role_id"
                  :error-messages="props.formErrors.role_id || []"
                  :items="processedRoles"
                  :rules="[requiredValidator]"
                  label="Role"
                  placeholder="Select role"
                  data-testid="role-selector"
                />
              </VCol>

              <!-- Actions -->
              <VCol cols="12">
                <VBtn
                  :loading="props.loading"
                  class="me-3"
                  type="submit"
                >
                Manage
                </VBtn>
                <VBtn
                  color="error"
                  variant="tonal"
                  @click="closeNavigationDrawer"
                  data-testid="cancel-drawer"
                >
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
  <AlertDialog
    :body-alert="bodyAlert"
    :is-dialog-visible="isAlertDialogVisible"
    :title-alert="titleAlert"
    :type="alertType"
    @update:is-dialog-visible="isAlertDialogVisible = $event"
  />
</template>
