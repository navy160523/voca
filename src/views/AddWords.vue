<template>
  <v-container fluid class="pa-4 animate-fade-in">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-black text-primary mb-2">단어 등록하기</h1>
    </div>

    <!-- 등록 모드 탭 -->
    <v-tabs v-model="activeTab" color="primary" align-tabs="start" class="mb-6 border-b">
      <v-tab value="manual" class="font-weight-bold">
        <v-icon start>mdi-pencil-outline</v-icon>개별 등록
      </v-tab>
      <v-tab value="bulk" class="font-weight-bold">
        <v-icon start>mdi-microsoft-excel</v-icon>일괄 등록 (엑셀/텍스트)
      </v-tab>
    </v-tabs>

    <!-- 1. 개별 등록 탭 -->
    <v-window v-model="activeTab">
      <v-window-item value="manual">
        <v-card elevation="2" rounded="xl" class="pa-4 pa-sm-6">
          <v-form @submit.prevent="saveWords">
            <!-- 분류 선택 -->
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
      </v-window-item>

      <!-- 2. 일괄 등록 탭 -->
      <v-window-item value="bulk">
        <v-card elevation="2" rounded="xl" class="pa-4 pa-sm-6">
          <!-- 분류 선택 -->
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

          <v-row>
            <!-- 설정 영역 -->
            <v-col cols="12" md="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">Day 설정 방식</div>
              <v-radio-group v-model="bulkDayMode" inline class="mb-4">
                <v-radio label="첫 번째 열에서 Day 자동 인식 (추천)" value="auto" color="primary"></v-radio>
                <v-radio label="특정 Day로 일괄 지정" value="single" color="primary"></v-radio>
              </v-radio-group>

              <!-- 단일 Day 선택 (지정 방식일 때만 표시) -->
              <v-expand-transition>
                <div v-if="bulkDayMode === 'single'" class="mb-6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Day 선택</div>
                  <v-chip-group v-model="bulkSingleDay" selected-class="text-white" column class="day-chip-grid">
                    <v-chip
                      v-for="n in 30"
                      :key="n"
                      :value="`Day ${n}`"
                      :color="getDayColor(n)"
                      :variant="bulkSingleDay === `Day ${n}` ? 'flat' : 'outlined'"
                      size="small"
                      rounded="lg"
                      class="font-weight-bold px-3"
                    >
                      {{ n }}
                    </v-chip>
                  </v-chip-group>
                </div>
              </v-expand-transition>

              <div class="text-subtitle-1 font-weight-bold mb-2">엑셀/텍스트 데이터 붙여넣기</div>
              <p class="text-caption text-grey-darken-1 mb-2">
                엑셀이나 스프레드시트의 셀을 복사(<kbd>Ctrl+C</kbd>)하여 아래 입력창에 그대로 붙여넣거나(<kbd>Ctrl+V</kbd>), CSV 파일을 업로드할 수 있습니다.<br>
                <strong>자동 인식 구조:</strong> [첫 열에 Day] | [단어] | [뜻] | [예문(선택)] 순서
              </p>

              <!-- 파일 업로드 -->
              <v-file-input
                label="CSV 또는 TXT 파일 선택"
                variant="outlined"
                density="compact"
                accept=".csv,.txt"
                prepend-icon="mdi-file-delimited-outline"
                class="mb-4"
                @update:modelValue="onFileChange"
                hide-details
              ></v-file-input>

              <!-- 직접 붙여넣기 영역 -->
              <v-textarea
                v-model="bulkText"
                label="여기에 데이터를 붙여넣으세요"
                placeholder="예시 (자동 인식 방식):&#10;day30&#9;susceptible&#9;~에 감염되기 쉬운&#9;He is susceptible to colds.&#10;day30&#9;another_word&#9;다른 뜻"
                variant="outlined"
                rows="10"
                clearable
                no-resize
                color="primary"
                class="font-mono"
              ></v-textarea>
            </v-col>

            <!-- 미리보기 영역 -->
            <v-col cols="12" md="6" class="border-s-md-only pl-md-6">
              <div class="d-flex justify-space-between align-center mb-3">
                <div class="text-subtitle-1 font-weight-bold">가져오기 미리보기 (총 {{ parsedWords.length }}개 감지됨)</div>
                <v-btn 
                  v-if="parsedWords.length > 0"
                  color="error" 
                  variant="text" 
                  size="small" 
                  prepend-icon="mdi-delete-sweep-outline"
                  @click="bulkText = ''"
                >
                  비우기
                </v-btn>
              </div>

              <v-card variant="outlined" rounded="lg" style="height: 380px; overflow-y: auto; background-color: rgba(var(--v-theme-on-surface), 0.02);">
                <template v-if="parsedWords.length > 0">
                  <v-table density="compact" fixed-header>
                    <thead>
                      <tr>
                        <th class="text-left font-weight-bold">Day</th>
                        <th class="text-left font-weight-bold">단어</th>
                        <th class="text-left font-weight-bold">뜻</th>
                        <th class="text-left font-weight-bold">예문</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(w, idx) in parsedWords" :key="idx">
                        <td><v-chip size="x-small" color="secondary" variant="flat" class="font-weight-bold">{{ w.day || '미정' }}</v-chip></td>
                        <td class="font-weight-medium">{{ w.word }}</td>
                        <td class="text-grey-darken-2">{{ w.meaning }}</td>
                        <td class="text-caption text-truncate" style="max-width: 150px;" :title="w.example">{{ w.example }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </template>
                <div v-else class="d-flex flex-column align-center justify-center fill-height py-12 text-grey-lighten-1">
                  <v-icon size="48" class="mb-2">mdi-database-import-outline</v-icon>
                  <div>데이터를 붙여넣거나 파일을 올리면</div>
                  <div>여기에 실시간 분석 결과가 나옵니다.</div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <div class="mt-8 d-flex justify-end">
            <v-btn
              color="primary"
              size="x-large"
              :loading="isSaving"
              :disabled="parsedWords.length === 0"
              elevation="4"
              rounded="pill"
              class="font-weight-bold px-8"
              @click="saveBulkWords"
            >
              일괄 등록 완료하기 ({{ parsedWords.length }}개 단어)
            </v-btn>
          </div>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from 'vuetify';

const theme = useTheme();

const categories = ['기본단어', '토익기초단어', '800단어', '900단어'];
const selectedCategory = ref('');

// 1. 개별 등록 탭 상태
const selectedDay = ref('');
const wordRows = ref([
  { word: '', meaning: '', example: '' }
]);

// 2. 일괄 등록 탭 상태
const activeTab = ref('manual');
const bulkText = ref('');
const bulkDayMode = ref('auto');
const bulkSingleDay = ref('');

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

// 파일 업로드 처리
const onFileChange = (file) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    bulkText.value = e.target.result;
  };
  reader.readAsText(file);
};

// 텍스트 실시간 파싱 계산
const parsedWords = computed(() => {
  if (!bulkText.value || !bulkText.value.trim()) return [];
  
  const lines = bulkText.value.split(/\r?\n/);
  const result = [];
  
  lines.forEach(line => {
    if (!line.trim()) return;
    
    // 엑셀에서 복사하면 탭(\t)으로 구분됨. CSV면 쉼표(,)
    let parts = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else {
      // 2개 이상의 띄어쓰기로 분리 시도
      parts = line.split(/\s{2,}/);
      if (parts.length <= 1) {
        // 최후의 보루: 띄어쓰기 하나로 분리
        parts = line.split(' ');
      }
    }
    
    parts = parts.map(p => p.trim()).filter(p => p !== '');
    
    if (bulkDayMode.value === 'auto') {
      if (parts.length < 2) return;
      
      const rawDay = parts[0];
      let dayVal = '';
      
      // 'day30', 'Day 30', '30' 등에서 숫자 추출
      const match = rawDay.match(/\d+/);
      if (match) {
        dayVal = `Day ${match[0]}`;
      } else {
        dayVal = rawDay; // 숫자 매칭이 없으면 그냥 텍스트
      }
      
      const wordVal = parts[1] || '';
      const meaningVal = parts[2] || '';
      const exampleVal = parts[3] || '';
      
      if (wordVal && meaningVal) {
        result.push({
          day: dayVal,
          word: wordVal,
          meaning: meaningVal,
          example: exampleVal
        });
      }
    } else {
      // 지정 Day 방식인 경우
      if (parts.length < 2) return;
      
      const wordVal = parts[0] || '';
      const meaningVal = parts[1] || '';
      const exampleVal = parts[2] || '';
      
      if (wordVal && meaningVal) {
        result.push({
          day: bulkSingleDay.value,
          word: wordVal,
          meaning: meaningVal,
          example: exampleVal
        });
      }
    }
  });
  
  return result;
});

// 개별 단어 저장
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

// 일괄 단어 저장
const saveBulkWords = async () => {
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

  if (bulkDayMode.value === 'single' && !bulkSingleDay.value) {
    return Swal.fire({ ...swalConfig, title: '날짜 미선택', text: '일괄 적용할 날짜(Day)를 선택해주세요.' });
  }

  const wordsToSave = parsedWords.value;
  if (wordsToSave.length === 0) {
    return Swal.fire({ ...swalConfig, title: '등록할 단어 없음', text: '유효한 단어 데이터가 감지되지 않았습니다.' });
  }

  isSaving.value = true;

  try {
    // Firestore batch limit is 500. So we chunk in batches of 400.
    const CHUNK_SIZE = 400;
    const wordChunks = [];
    for (let i = 0; i < wordsToSave.length; i += CHUNK_SIZE) {
      wordChunks.push(wordsToSave.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of wordChunks) {
      const batch = writeBatch(db);
      chunk.forEach(row => {
        const docRef = doc(collection(db, "words"));
        batch.set(docRef, {
          day: row.day ? row.day.trim() : 'Day 1',
          category: selectedCategory.value,
          word: row.word.trim(),
          meaning: row.meaning.trim(),
          example: row.example ? row.example.trim() : '',
          isMemorized: false,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
    }

    isSaving.value = false;
    
    Swal.fire({
      ...swalConfig,
      title: '일괄 등록 성공!',
      text: `총 ${wordsToSave.length}개의 단어가 성공적으로 등록되었습니다.`,
      icon: 'success',
      confirmButtonColor: '#10B981'
    });
    
    bulkText.value = '';
    
  } catch (error) {
    console.error("일괄 저장 오류:", error);
    Swal.fire({ ...swalConfig, title: '저장 실패', text: '일괄 등록 도중 오류가 발생했습니다.', icon: 'error' });
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

.font-mono {
  font-family: monospace, Courier, monospace;
}
</style>
