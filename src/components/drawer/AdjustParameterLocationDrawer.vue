<script setup>
import { ref, watch, nextTick } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppDrawerHeaderSection from "@core/components/AppDrawerHeaderSection.vue"

const props = defineProps({
  isDrawerOpen: Boolean,

  // posisi
  positionX: Number,
  positionY: Number,
  positionZ: Number,

  // rotasi
  rotationX: Number,
  rotationY: Number,
  rotationZ: Number,
})

const emit = defineEmits([
  "update:isDrawerOpen",
  "update:isPositionChanged",

  "update:positionX",
  "update:positionY",
  "update:positionZ",
  "update:rotationX",
  "update:rotationY",
  "update:rotationZ",

  "submit",
  "close",
])

// reset drawer
const closeDrawer = () => {
  emit("update:isDrawerOpen", false)
  emit("close")
}
</script>

<template>
  <VNavigationDrawer
    :model-value="isDrawerOpen"
    :width="380"
    location="end"
    temporary
    @update:model-value="val => emit('update:isDrawerOpen', val)"
  >
    <!-- Header -->
    <AppDrawerHeaderSection
      title="Adjust Parameter Location"
      @cancel="closeDrawer"
    />

    <VDivider/>

    <VCard flat>
      <VCardText>
        <VForm>
          <VRow>
            <!-- Position -->
            <VCol cols="12">
              <h4 class="mt-1 mb-1">Position</h4>
            </VCol>

            <VCol cols="12">
              <AppTextField
                :model-value="props.positionX"
                label="Position X"
                type="number"
                @update:model-value="val => {
                  emit('update:positionX', Number(val))
                  emit('update:isPositionChanged', true)
                }"
              />
            </VCol>

            <VCol cols="12">
              <AppTextField
                :model-value="props.positionY"
                label="Position Y"
                type="number"
                @update:model-value="val => emit('update:positionY', Number(val))"
              />
            </VCol>

            <VCol cols="12">
              <AppTextField
                :model-value="props.positionZ"
                label="Position Z"
                type="number"
                @update:model-value="val => emit('update:positionZ', Number(val))"
              />
            </VCol>

            <VDivider class="my-2"/>

            <!-- Rotation -->
            <VCol cols="12">
              <h4 class="mt-1 mb-1">Rotation</h4>
            </VCol>

            <VCol cols="12">
              <AppTextField
                :model-value="props.rotationX"
                label="Rotation X"
                type="number"
                @update:model-value="val => emit('update:rotationX', Number(val))"
              />
            </VCol>

            <VCol cols="12">
              <AppTextField
                :model-value="props.rotationY"
                label="Rotation Y"
                type="number"
                @update:model-value="val => emit('update:rotationY', Number(val))"
              />
            </VCol>

            <VCol cols="12">
              <AppTextField
                :model-value="props.rotationZ"
                label="Rotation Z"
                type="number"
                @update:model-value="val => emit('update:rotationZ', Number(val))"
              />
            </VCol>

            <!-- Actions -->
            <VCol cols="12">
              <VBtn
                block
                color="primary"
                @click="emit('submit')"
              >
                Apply Changes
              </VBtn>
            </VCol>

            <VCol cols="12">
              <VBtn
                block
                color="secondary"
                variant="tonal"
                @click="closeDrawer"
              >
                Close
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VNavigationDrawer>
</template>
