<script setup>
import { VForm } from 'vuetify/components/VForm'

const props = defineProps({
  rolePermissions: {
    type: Object,
    required: false,
    default: () => ({
      name: '',
      id: '',
      permissions: [],
    }),
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const permissions = ref([])

const emit = defineEmits([
  'update:isDialogVisible',
  'update:rolePermissions',
])


const role = ref('')
const refPermissionForm = ref()
const checkedCount = computed(() =>
  permissions.value.filter(p => p.checked).length,
)

const totalPermissionCount = computed(() => permissions.value.length)

const initialized = ref(false)

const isIndeterminate = computed(() =>
  initialized.value &&
  checkedCount.value > 0 &&
  checkedCount.value < totalPermissionCount.value,
)


const isSelectAll = computed({
  get: () => checkedCount.value === totalPermissionCount.value && totalPermissionCount.value > 0,
  set: (val) => {
    permissions.value = permissions.value.map(p => ({ ...p, checked: val }))
  },
})


// if all permissions are checked, then set isSelectAll to true


// if rolePermissions is not empty, then set permissions
watch(
  () => props.rolePermissions,
  (newVal) => {
    if (newVal && newVal.permissions?.length) {
      role.value = newVal.name
      permissions.value = permissions.value.map(permission => {
        const rolePermission = newVal.permissions.find(item => item.name === permission.name)
        return rolePermission ? { ...permission, ...rolePermission, checked: true } : { ...permission, checked: false }
      })
    }
  },
  { deep: true, immediate: true },
)


// Group by feature
const groupedPermissions = computed(() => {
  const groups = {}
  permissions.value.forEach(p => {
    if (!groups[p.feature]) {
      groups[p.feature] = { feature: p.feature, name: p.label, permissions: [] }
    }
    groups[p.feature].permissions.push(p)
  })
  return groups
})

const fetchPermissions = async () => {
  try {
    const response = await $api(`/permissions`, { method: 'GET' })
    permissions.value = response.permissions

    // Jika rolePermissions dari parent sudah ada, merge disini
    if (props.rolePermissions && props.rolePermissions.permissions?.length) {
      role.value = props.rolePermissions.name
      permissions.value = permissions.value.map(permission => {
        const rolePermission = props.rolePermissions.permissions.find(item => item.name === permission.name)
        return rolePermission ? { ...permission, ...rolePermission, checked: true } : permission
      })
    }
  } catch (err) {
    console.error('Failed to fetch registers:', err)
  }
}

onMounted(() => {
  fetchPermissions().then(() => {
    initialized.value = true
  })
})

const onSubmit = async () => {
  const selectedPermissionIds = permissions.value
    .filter(p => p.checked) // ambil hanya yang dicentang
    .map(p => p.id)

  const payload = {
    role_id: props.rolePermissions?.id || null,
    permission_id: selectedPermissionIds,
  }


  emit('update:isDialogVisible', false)
  emit('update:rolePermissions', payload)

  isSelectAll.value = false
  refPermissionForm.value?.reset()
}

const onReset = () => {
  emit('update:isDialogVisible', false)
  isSelectAll.value = false
  if (!props.rolePermissions?.id) {
    refPermissionForm.value?.reset()
  }
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="onReset"
  >
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="onReset"/>

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <!-- 👉 Title -->
        <h4 class="text-h4 text-center mb-2">
          {{ props.rolePermissions.name ? 'Edit' : 'Add New' }} Role
        </h4>
        <p class="text-body-1 text-center mb-6">
          Set Role Permissions
        </p>

        <!-- 👉 Form -->
        <VForm ref="refPermissionForm">
          <!-- 👉 Role name -->
          <AppTextField
            v-model="role"
            label="Role Name"
            placeholder="Enter Role Name"
          />

          <h5 class="text-h5 my-6">
            Role Permissions
          </h5>

          <!-- 👉 Role Permissions -->

          <VTable class="permission-table text-no-wrap mb-6">
            <!-- 👉 Admin  -->
            <tr>
              <td>
                <h6 class="text-h6">
                  Administrator Access
                </h6>
              </td>
              <td colspan="4">
                <div class="d-flex justify-end">
                  <VCheckbox
                    :model-value="isSelectAll"
                    :indeterminate="isIndeterminate"
                    label="Select All"
                    @update:model-value="isSelectAll = $event"
                  />
                </div>
              </td>
            </tr>

            <!-- 👉 Other permission loop -->
            <template v-for="group in groupedPermissions" :key="group.feature">
              <tr>
                <td>
                  <h6 class="text-h6">{{ group.feature }}</h6>
                </td>

                <!-- Permission checkboxes -->
                <td v-for="permission in group.permissions" :key="permission.id">
                  <div class="d-flex justify-end text-danger">
                    <VCheckbox
                      v-model="permission.checked"
                      :label="permission.label"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </VTable>

          <!-- 👉 Actions button -->
          <div class="d-flex align-center justify-center gap-4">
            <VBtn @click="onSubmit">
              Submit
            </VBtn>

            <VBtn
              color="secondary"
              variant="tonal"
              @click="onReset"
            >
              Cancel
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.permission-table {
  td {
    border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding-block: 0.5rem;

    .v-checkbox {
      min-inline-size: 4.75rem;
    }

    &:not(:first-child) {
      padding-inline: 0.5rem;
    }

    .v-label {
      white-space: nowrap;
    }
  }
}
</style>
