<template>
  <v-container fluid class="pa-4 animate-fade-in">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-black text-primary mb-2">단어 등록하기</h1>
    </div>

    <v-card elevation="2" rounded="xl" class="pa-4 pa-sm-6">
      <v-form @submit.prevent="saveWords">
        
        <div class="mb-6">
          <div class="text-subtitle-1 font-weight-bold mb-2">분류 선택</div>
          <v-chip-group v-model="selectedCategory" selected-class="text-white" column>
            <v-chip
              v-for="cat in categories"
              :key="cat"
              :value="cat"
              :color="getCategoryColor(cat)"
              :variant="selectedCategory === cat ? 'flat' : 'outlined'"
              size="large"
              rounded="lg"
              class="font-weight-bold px-4"
              elevation="selectedCategory === cat ? 2 : 0"
            >
              {{ cat }}
            </v-chip>
          </v-chip-group>
        </div>

        <v-divider class="mb-6"></v-divider>

        <div class="mb-8">
          <div class="text-subtitle-1 font-weight-bold mb-2">Day 선택</div>
          <v-chip-group v-model="selectedDay" selected-class="text-white" column class="day-chip-grid">
            <v-chip
              v-for="n in 30"
              :key="n"
              :value="`Day ${n}`"
              :color="getDayColor(n)"
              :variant="selectedDay === `Day ${n}` ? 'flat' : 'outlined'"
              size="large"
              rounded="lg"
              class="font-weight-bold px-4"
              elevation="selectedDay === `Day ${n}` ? 2 : 0"
            >
              {{ n }}
            </v-chip>
          </v-chip-group>
        </div>

        <v-divider class="mb-6"></v-divider>

        <div class="mb-4">
          <h3 class="text-h6 font-weight-bold">단어 목록 ({{ wordRows.length }}개)</h3>
        </div>

        <v-card 
          v-for="(row, index) in wordRows" 
          :key="index" 
          class="mb-6 mb-sm-8 border-sm transition-swing" 
          variant="flat"
          rounded="lg"
          style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12);"
        >
          <div class="d-flex justify-space-between align-center px-4 pt-3 pb-0">
            <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">
              단어 {{ index + 1 }}
            </v-chip>
            <v-btn 
              color="error" 
              variant="text" 
              icon="mdi-trash-can-outline" 
              size="small"
              @click="removeRow(index)"
              :disabled="wordRows.length === 1"
            ></v-btn>
          </div>
          <v-card-text class="pt-2">
            <v-row class="mt-0">
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="row.word"
                  label="단어 (Word)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  color="primary"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-text-field
                  v-model="row.meaning"
                  label="뜻 (Meaning)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  color="primary"
                ></v-text-field>
              </v-col>
              <v-col cols="12" class="py-1 pt-3">
                <v-text-field
                  v-model="row.example"
                  label="예문 (선택사항)"
                  variant="underlined"
                  density="compact"
                  hide-details
                  color="secondary"
                  prepend-inner-icon="mdi-format-quote-open"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 단어 추가 버튼 (카드 밑) -->
        <div class="mb-8">
          <v-btn 
            color="primary" 
            variant="tonal" 
            prepend-icon="mdi-plus" 
            @click="addRow" 
            rounded="lg" 
            size="large" 
            block
            style="border: 2px dashed rgba(var(--v-theme-primary), 0.4); border-radius: 8px;"
          >
            단어 추가하기
          </v-btn>
        </div>

        <div class="mt-8 d-flex justify-end">
          <v-btn
            type="submit"
            color="primary"
            size="x-large"
            :loading="isSaving"
            elevation="4"
            rounded="pill"
            class="font-weight-bold px-8"
          >
            작성한 단어 모두 등록하기
          </v-btn>
        </div>

      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from 'vuetify';

const theme = useTheme();

const categories = ['기본단어', '토익기초단어', '800단어', '900단어'];
const selectedDay = ref('');
const selectedCategory = ref('');
const wordRows = ref([
  { word: '', meaning: '', example: '' }
]);

const isSaving = ref(false);

const addRow = () => {
  wordRows.value.push({ word: '', meaning: '', example: '' });
};

const removeRow = (index) => {
  if (wordRows.value.length > 1) {
    wordRows.value.splice(index, 1);
  }
};

const getCategoryColor = (cat) => {
  switch(cat) {
    case '기본단어': return '#10B981';
    case '토익기초단어': return '#3B82F6';
    case '800단어': return '#F59E0B';
    case '900단어': return '#EF4444';
    default: return 'primary';
  }
};

const getDayColor = (day) => {
  const hue = (day * 12) % 360;
  return `hsl(${hue}, 75%, 55%)`;
};

const saveWords = async () => {
  const isDark = theme.global.current.value.dark;
  const swalConfig = {
    background: isDark ? '#1F2937' : '#FFFFFF',
    color: isDark ? '#F9FAFB' : '#111827',
    confirmButtonColor: '#4F46E5',
    icon: 'warning'
  };

  if (!selectedCategory.value) {
    return Swal.fire({ ...swalConfig, title: '분류 미선택', text: '분류를 선택해주세요.' });
  }

  if (!selectedDay.value) {
    return Swal.fire({ ...swalConfig, title: '날짜 미선택', text: '날짜(Day)를 선택해주세요.' });
  }

  for (let i = 0; i < wordRows.value.length; i++) {
    const row = wordRows.value[i];
    if (!row.word.trim()) {
      return Swal.fire({ ...swalConfig, title: '단어 미입력', text: '단어를 적어주세요.' });
    }
    if (!row.meaning.trim()) {
      return Swal.fire({ ...swalConfig, title: '뜻 미입력', text: '단어 뜻을 적어주세요.' });
    }
  }

  const validRows = wordRows.value;
  isSaving.value = true;

  try {
    const batch = writeBatch(db);
    
    validRows.forEach(row => {
      const docRef = doc(collection(db, "words"));
      batch.set(docRef, {
        day: selectedDay.value,
        category: selectedCategory.value,
        word: row.word.trim(),
        meaning: row.meaning.trim(),
        example: row.example ? row.example.trim() : '',
        isMemorized: false,
        createdAt: new Date().toISOString()
      });
    });

    await batch.commit();
    isSaving.value = false;
    
    Swal.fire({
      ...swalConfig,
      title: '등록 성공!',
      text: `총 ${validRows.length}개의 단어가 성공적으로 등록되었습니다.`,
      icon: 'success',
      confirmButtonColor: '#10B981'
    });
    
    wordRows.value = [{ word: '', meaning: '', example: '' }];
    
  } catch (error) {
    console.error("저장 오류:", error);
    Swal.fire({ ...swalConfig, title: '저장 실패', text: '오류가 발생했습니다.', icon: 'error' });
    isSaving.value = false;
  }
};
</script>

<style scoped>
@media (min-width: 1024px) {
  .day-chip-grid :deep(.v-slide-group__content) {
    display: grid;
    grid-template-columns: repeat(15, 1fr);
    gap: 12px;
    width: 100%;
  }

  .day-chip-grid :deep(.v-chip) {
    width: 100%;
    margin: 0 !important;
    justify-content: center;
  }
}
</style>
