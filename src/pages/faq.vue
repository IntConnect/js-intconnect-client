<script setup>
import sittingGirlWithLaptop from '@images/illustrations/sitting-girl-with-laptop.png'

const faqSearchQuery = ref('')
const faqs = ref([])


const activeTab = ref('Payment')
const activeQuestion = ref(0)

watch(activeTab, () => activeQuestion.value = 0)

const contactUs = [
  {
    icon: 'tabler-phone',
    via: '+ (810) 2548 2568',
    tagLine: 'We are always happy to help!',
  },
  {
    icon: 'tabler-mail',
    via: 'hello@help.com',
    tagLine: 'Best way to get answer faster!',
  },
]
</script>

<template>
  <section>
    <!-- 👉 Search -->
    <AppSearchHeader
      custom-class="mb-6"
      density="comfortable"
      is-reverse
      placeholder="Search Articles..."
      subtitle="or choose a category to quickly find the help you need"
      title="Hello, how can we help?"
    />

    <!-- 👉 Faq sections and questions -->
    <VRow>
      <VCol
        v-show="faqs.length"
        class="position-relative"
        cols="12"
        lg="3"
        sm="4"
      >
        <!-- 👉 Tabs -->
        <VTabs
          v-model="activeTab"
          class="v-tabs-pill"
          direction="vertical"
          grow
        >
          <VTab
            v-for="faq in faqs"
            :key="faq.faqTitle"
            :value="faq.faqTitle"
          >
            <VIcon
              :icon="faq.faqIcon"
              :size="20"
              start
            />
            {{ faq.faqTitle }}
          </VTab>
        </VTabs>
        <VImg
          :src="sittingGirlWithLaptop"
          :width="245"
          class="d-none d-sm-block mt-4 mx-auto"
        />
      </VCol>

      <VCol
        cols="12"
        lg="9"
        sm="8"
      >
        <!-- 👉 Windows -->
        <VWindow
          v-model="activeTab"
          class="faq-v-window disable-tab-transition"
        >
          <VWindowItem
            v-for="faq in faqs"
            :key="faq.faqTitle"
            :value="faq.faqTitle"
          >
            <div class="d-flex align-center mb-4">
              <VAvatar
                class="me-4"
                color="primary"
                rounded
                size="50"
                variant="tonal"
              >
                <VIcon
                  :icon="faq.faqIcon"
                  :size="30"
                />
              </VAvatar>

              <div>
                <h5 class="text-h5">
                  {{ faq.faqTitle }}
                </h5>
                <div class="text-body-1">
                  {{ faq.faqSubtitle }}
                </div>
              </div>
            </div>

            <VExpansionPanels
              v-model="activeQuestion"
              multiple
            >
              <VExpansionPanel
                v-for="item in faq.faqs"
                :key="item.question"
                :text="item.answer"
                :title="item.question"
              />
            </VExpansionPanels>
          </VWindowItem>
        </VWindow>
      </VCol>

      <VCol
        v-show="!faqs.length"
        :class="!faqs.length ? 'd-flex justify-center align-center' : ''"
        cols="12"
      >
        <VIcon
          icon="tabler-help"
          size="20"
          start
        />
        <span class="text-base font-weight-medium">
          No Results Found!!
        </span>
      </VCol>
    </VRow>

    <!-- 👉 You still have a question? -->
    <div class="text-center pt-16">
      <VChip
        class="mb-2"
        color="primary"
        label
        size="small"
      >
        Question
      </VChip>

      <h4 class="text-h4 mb-2">
        You still have a question?
      </h4>
      <p class="text-body-1 mb-6">
        If you can't find question in our FAQ, you can contact us. We'll answer you shortly!
      </p>

      <!-- contacts -->
      <VRow class="mt-9">
        <VCol
          v-for="contact in contactUs"
          :key="contact.icon"
          cols="12"
          sm="6"
        >
          <VCard
            flat
            style="background-color: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));"
          >
            <VCardText class="pb-4">
              <VAvatar
                color="primary"
                rounded
                size="46"
                variant="tonal"
              >
                <VIcon
                  :icon="contact.icon"
                  size="26"
                />
              </VAvatar>
            </VCardText>
            <VCardText>
              <h5 class="text-h5 mb-1">
                {{ contact.via }}
              </h5>
              <div>{{ contact.tagLine }}</div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </section>
</template>

<style lang="scss">
.faq-v-window {
  .v-window__container {
    z-index: 0;
  }
}
</style>
