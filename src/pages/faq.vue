<script setup>
import sittingGirlWithLaptop from '@images/illustrations/sitting-girl-with-laptop.png'

const faqSearchQuery = ref('')
const faqs = ref([
  {
    faqTitle: 'Umum',
    faqIcon: 'tabler-info-circle',
    faqSubtitle: 'Informasi dasar mengenai sistem Digital Twin Chiller',
    faqs: [
      {
        question: 'Apa itu Digital Twin Chiller?',
        answer:
          'Digital Twin Chiller adalah representasi digital dari sistem chiller fisik yang mereplikasi kondisi operasional secara real-time menggunakan data sensor. Sistem ini memungkinkan pemantauan, analisis, dan simulasi performa chiller tanpa harus berinteraksi langsung dengan perangkat fisik.',
      },
      {
        question: 'Apa manfaat utama Digital Twin pada sistem chiller?',
        answer:
          'Manfaat utama meliputi pemantauan kondisi real-time, deteksi dini anomali, analisis efisiensi energi, prediksi potensi kerusakan, serta pengambilan keputusan berbasis data untuk meningkatkan keandalan dan umur pakai chiller.',
      },
      {
        question: 'Apakah Digital Twin menggantikan sistem chiller fisik?',
        answer:
          'Tidak. Digital Twin tidak menggantikan chiller fisik, melainkan berfungsi sebagai sistem pendukung yang merepresentasikan kondisi aktual chiller untuk keperluan monitoring, analisis, dan optimasi.',
      },
    ],
  },
  {
    faqTitle: 'Monitoring',
    faqIcon: 'tabler-device-analytics',
    faqSubtitle: 'Pemantauan data dan kondisi operasional chiller',
    faqs: [
      {
        question: 'Parameter apa saja yang dimonitor pada Digital Twin Chiller?',
        answer:
          'Parameter yang umumnya dimonitor meliputi suhu masuk dan keluar, tekanan, arus listrik, konsumsi daya, status kompresor, serta parameter lingkungan seperti kelembaban atau level oksigen jika diperlukan.',
      },
      {
        question: 'Apakah data yang ditampilkan bersifat real-time?',
        answer:
          'Ya. Data diperoleh dari sensor yang terpasang pada chiller dan dikirim melalui protokol komunikasi seperti MQTT, sehingga informasi yang ditampilkan bersifat real-time atau mendekati real-time.',
      },
      {
        question: 'Bagaimana cara membaca grafik performa chiller?',
        answer:
          'Grafik menampilkan tren perubahan parameter terhadap waktu. Kenaikan atau penurunan yang tidak wajar dapat menjadi indikasi adanya gangguan atau penurunan efisiensi pada sistem chiller.',
      },
    ],
  },
  {
    faqTitle: 'Analisis & Anomali',
    faqIcon: 'tabler-alert-triangle',
    faqSubtitle: 'Analisis performa dan deteksi kondisi abnormal',
    faqs: [
      {
        question: 'Apa yang dimaksud dengan kondisi abnormal pada chiller?',
        answer:
          'Kondisi abnormal adalah keadaan ketika nilai parameter operasional berada di luar batas normal yang telah ditentukan, seperti suhu terlalu tinggi, konsumsi daya berlebih, atau tekanan yang tidak stabil.',
      },
      {
        question: 'Bagaimana sistem mendeteksi anomali?',
        answer:
          'Sistem membandingkan data sensor dengan ambang batas (threshold) atau pola normal operasional. Jika terjadi penyimpangan signifikan, sistem akan menandai kondisi tersebut sebagai anomali.',
      },
      {
        question: 'Apakah sistem memberikan notifikasi saat terjadi anomali?',
        answer:
          'Ya. Sistem dapat dikonfigurasi untuk mengirimkan notifikasi, seperti melalui email atau dashboard alert, ketika terdeteksi kondisi abnormal pada chiller.',
      },
    ],
  },
  {
    faqTitle: 'Pemeliharaan',
    faqIcon: 'tabler-tool',
    faqSubtitle: 'Dukungan terhadap pemeliharaan dan perawatan chiller',
    faqs: [
      {
        question: 'Bagaimana Digital Twin membantu pemeliharaan chiller?',
        answer:
          'Digital Twin membantu dengan menyediakan data historis dan analisis tren performa, sehingga teknisi dapat melakukan pemeliharaan prediktif sebelum terjadi kerusakan serius.',
      },
      {
        question: 'Apakah sistem dapat digunakan untuk prediksi kerusakan?',
        answer:
          'Ya. Dengan analisis pola data jangka panjang, sistem dapat mengindikasikan potensi kerusakan komponen tertentu sehingga tindakan pencegahan dapat dilakukan lebih awal.',
      },
    ],
  },
  {
    faqTitle: 'Keamanan & Data',
    faqIcon: 'tabler-shield-lock',
    faqSubtitle: 'Keamanan sistem dan pengelolaan data',
    faqs: [
      {
        question: 'Apakah data Digital Twin Chiller aman?',
        answer:
          'Keamanan data dijaga melalui mekanisme autentikasi, otorisasi, serta penggunaan protokol komunikasi yang aman untuk mencegah akses tidak sah.',
      },
      {
        question: 'Apakah data historis chiller disimpan?',
        answer:
          'Ya. Data historis disimpan untuk keperluan analisis performa, evaluasi efisiensi energi, serta dokumentasi operasional sistem chiller.',
      },
    ],
  },
])


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
