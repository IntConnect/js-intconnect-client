<script setup>
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import DialogCloseBtn from "@core/components/DialogCloseBtn.vue"
import { nextTick } from "vue"
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

const emit = defineEmits([
  'update:isDialogVisible',
  'submit',
])


const {
  permissions,
  fetchPermissions,
} = useFetchPermission()

const loadPermissions = async () => {
  await fetchPermissions()
  await nextTick()


}


onMounted(() => {
  loadPermissions()
})

const id = ref('')
const name = ref('')
const description = ref('')
const refPermissionForm = ref()


const checkedCount = computed(() => {

  return ungroupedPermissions?.value.filter(p => p.checked).length
})

const totalPermissionCount = computed(() => permissions.value.length)

const initialized = ref(false)

const isIndeterminate = computed(() =>
  initialized.value &&
  checkedCount.value > 0 &&
  checkedCount.value < totalPermissionCount.value,
)


const isSelectAll = computed({
  get: () => checkedCount.value === totalPermissionCount.value && totalPermissionCount.value > 0,
  set: val => {
    ungroupedPermissions.value = ungroupedPermissions.value.map(p => ({ ...p, checked: val }))
  },
})

const ungroupedPermissions = ref([])

// if all permissions are checked, then set isSelectAll to true


// if rolePermissions is not empty, then set permissions
watch(
  [() => props.rolePermissions?.id, () => permissions.value],
  ([roleId, permissionsVal]) => {
    if (!Array.isArray(permissionsVal['entries'])) return []
    // ADD MODE
    if (!roleId) {
      id.value = ''
      name.value = ''
      description.value = ''
      ungroupedPermissions.value = permissionsVal.entries.map(p => ({
        ...p,
        checked: false,
      }))
      return
    }

    // EDIT MODE
    const role = props.rolePermissions
    id.value = role.id
    name.value = role.name
    description.value = role.description

    ungroupedPermissions.value = permissionsVal.entries.map(permission => {
      const rolePermission = role.permissions.find(p => p.code === permission.code)
      return {
        ...permission,
        checked: !!rolePermission,
      }
    })
  },
  { immediate: true },
)



// Group by category
const groupedPermissions = computed(() => {
  const groups = {}

  ungroupedPermissions.value.forEach(p => {
    if (!groups[p.category]) {
      groups[p.category] = { category: p.category, name: p.name, permissions: [] }
    }
    groups[p.category].permissions.push(p)
  })

  return groups
})



const onSubmit = async () => {
  const selectedPermissionIds = ungroupedPermissions.value
    .filter(p => p.checked) // ambil hanya yang dicentang
    .map(p => p.id)


  const payload = {
    id: id.value,
    name: name.value,
    description: description.value,
    permission_ids: selectedPermissionIds,
  }


  emit('update:isDialogVisible', false)
  emit('submit', payload)

  isSelectAll.value = false
  refPermissionForm.value?.reset()
  refPermissionForm.value?.resetValidation()

}

const onReset = () => {
  emit('update:isDialogVisible', false)
  isSelectAll.value = false
  refPermissionForm.value?.reset()
  refPermissionForm.value?.resetValidation()
}
</script>

<template>
  <VDialog :model-value="props.isDialogVisible" :width="$vuetify.display.smAndDown ? 'auto' : 900"
    @update:model-value="onReset">
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="onReset" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <!-- 👉 Title -->
        <h4 class="text-h4 text-center mb-2">
          {{ props.rolePermissions?.name ? 'Edit' : 'Add New' }} Role
        </h4>
        <p class="text-body-1 text-center mb-6">
          Set Role Permissions
        </p>

        <!-- 👉 Form -->
        <VForm ref="refPermissionForm">
          <!-- 👉 Role name -->
          <AppTextField v-model="name" label="Role Name" placeholder="Enter Role Name" />
          <AppTextField v-model="description" class="my-3" label="Description" placeholder="Enter Description" />

          <h5 class="text-h5 my-6">
            Role Permissions
          </h5>

          <!-- 👉 Role Permissions -->

          <VTable class="permission-table text-no-wrap mb-6">
            <!-- 👉 Admin  -->
            <tr>
              <td>
                <h6 class="text-h6">
                  Permission Access
                </h6>
              </td>
              <td colspan="4">
                <div class="d-flex justify-end">
                  <VCheckbox :indeterminate="isIndeterminate" :model-value="isSelectAll" label="Select All"
                    @update:model-value="isSelectAll = $event" />
                </div>
              </td>
            </tr>

            <!-- 👉 Other permission loop -->
            <template v-for="group in groupedPermissions" :key="group.category">
              <tr>
                <td>
                  <h6 class="text-h6">
                    {{ group.category }}
                  </h6>
                </td>

                <!-- Permission checkboxes -->
                <td v-for="permission in group.permissions" :key="permission.id">
                  <div class="d-flex justify-end text-danger">
                    <VCheckbox v-model="permission.checked" :label="permission.name" />
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

            <VBtn color="secondary" variant="tonal" @click="onReset">
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
