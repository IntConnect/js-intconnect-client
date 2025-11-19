<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"

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
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'userData',
])


const isFormValid = ref(false)
const refForm = ref()

// form fields
const id = ref('')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const roleId = ref('')
const roles = ref([])
const username = ref('')

// eye toggle
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
  })
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      if (password.value !== confirmPassword.value) {
        alert('Passwords do not match')

        return
      }

      emit('userData', {
        id: id.value,
        username: username.value,
        name: name.value,
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
        roleId: roleId.value,
      })

      nextTick(() => {
        if (!props.isDrawerOpen) {
          refForm.value?.reset()
          refForm.value?.resetValidation()
        }
      })
    }
  })
}


watch(
  () => props.userData,
  val => {
    if (val && Object.keys(val).length) {
      id.value = val.id || ''
      name.value = val.name || ''
      email.value = val.email || ''
      roleId.value = val.role.id
      username.value = val.username || ''
    }
  },
  { immediate: true, deep: true }, // deep: true bisa berguna kalau properti dalam objek bisa berubah
)

async function fetchRoles() {
  try {
    const { data: response } = await useApi(`/roles`).get().json()

    console.log(response.value)
    roles.value = response.value.data.map(role => ({
      title: role.name, // ditampilkan
      value: role.id,     // jadi value
    }))
    console.log(roles)
  } catch (err) {
    console.error('Failed to fetch roles:', err)
  }
}


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
    data-allow-mismatch
    location="end"
    temporary
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Title -->
    <AppDrawerHeaderSection
      title="Register User"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="username"
                  :error-messages="props.formErrors.username || []"
                  :rules="[requiredValidator]"
                  label="Username"
                  placeholder="administrator"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="name"
                  :error-messages="props.formErrors.name || []"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="John Doe"
                />
              </VCol>

              <!-- 👉 Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="email"
                  :error-messages="props.formErrors.email || []"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="johndoe@email.com"
                />
              </VCol>

              <!-- 👉 Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error-messages="props.formErrors.password || []"
                  :rules="[
                    ...(id ? [] : [requiredValidator]),
                  ]"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  label="Password"
                  placeholder="••••••••"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <!-- 👉 Confirm Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="confirmPassword"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error-messages="props.formErrors.confirmPassword || []"
                  :rules="[
                    ...(id ? [] : [requiredValidator]),
                  ]"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  label="Confirm Password"
                  placeholder="••••••••"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="roleId"
                  :items="roles"
                  label="Role"
                  placeholder="Select role"
                />
              </VCol>


              <!-- 👉 Submit and Cancel -->
              <VCol cols="12">
                <VBtn
                  class="me-3"
                  type="submit"
                >
                  Register
                </VBtn>
                <VBtn
                  color="error"
                  type="reset"
                  variant="tonal"
                  @click="closeNavigationDrawer"
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
</template>
