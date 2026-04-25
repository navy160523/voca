<template>
  <v-container fluid class="pa-4 animate-fade-in">
    <div class="d-flex flex-column flex-md-row justify-space-between align-md-center mb-6">
      <h1 class="text-h4 font-weight-black text-primary mb-4 mb-md-0">
        단어 보기 <span class="text-h5 text-medium-emphasis font-weight-bold ml-1">({{ filteredWords.length }}개)</span>
      </h1>
      
      <div class="d-flex flex-wrap align-center" style="gap: 16px;">
        <v-btn 
          v-if="selectedIds.length > 0" 
          color="error" 
          variant="flat" 
          prepend-icon="mdi-trash-can"
          @click="deleteSelected"
        >
          선택 삭제 ({{ selectedIds.length }})
        </v-btn>

        <v-select
          v-model="filterDay"
          :items="dayOptions"
          label="날짜 필터"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 150px;"
        ></v-select>
        
        <v-select
          v-model="filterCategory"
          :items="categoryOptions"
          label="분류 필터"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 150px;"
        ></v-select>

        <v-select
          v-model="filterStatus"
          :items="statusOptions"
          label="암기 상태"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 150px;"
        ></v-select>
      </div>
    </div>

    <v-card elevation="2" rounded="xl" class="pa-4 pa-md-6" color="surface">
      <div v-if="filteredWords.length === 0" class="text-center pa-10">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-magnify-remove-outline</v-icon>
        <p class="text-h6 text-medium-emphasis">검색 조건에 맞는 단어가 없습니다.</p>
      </div>

      <v-row v-else>
        <v-col 
          v-for="word in filteredWords" 
          :key="word.id" 
          cols="12" sm="6" md="4" lg="3"
        >
          <v-hover v-slot="{ isHovering, props }">
            <v-card
              v-bind="props"
              :elevation="isHovering ? 6 : 2"
              class="h-100 d-flex flex-column transition-swing"
              :style="{ 'border-left': `5px solid ${getCategoryColor(word.category)}` }"
            >
              <div class="d-flex justify-space-between align-center pa-2 pb-0">
                <div class="d-flex align-center" style="gap: 8px;">
                  <v-checkbox-btn
                    v-model="selectedIds"
                    :value="word.id"
                    color="error"
                    density="compact"
                  ></v-checkbox-btn>
                  
                  <v-chip size="small" :color="getDayColor(word.day)" variant="tonal" class="font-weight-bold">
                    {{ word.day }}
                  </v-chip>
                  <v-chip size="small" :color="getCategoryColor(word.category)" variant="flat" class="font-weight-bold text-white">
                    {{ word.category }}
                  </v-chip>
                </div>

              </div>
              
              <v-card-text class="flex-grow-1 pt-2 transition-swing" :class="{ 'memorized-blur': word.isMemorized }">
                <div class="text-h5 font-weight-black mb-2 transition-swing" :class="{ 'text-decoration-line-through text-medium-emphasis': word.isMemorized, 'text-primary': !word.isMemorized }">
                  {{ word.word }}
                </div>
                <div class="text-body-1 transition-swing" :class="{ 'text-medium-emphasis text-decoration-line-through': word.isMemorized }">
                  {{ word.meaning }}
                </div>
                <div v-if="word.example" class="mt-3 pa-2 bg-grey-lighten-4 rounded text-body-2 font-italic text-medium-emphasis transition-swing" :class="{ 'text-decoration-line-through': word.isMemorized }">
                  "{{ word.example }}"
                </div>
              </v-card-text>

              <v-divider></v-divider>
              <div class="px-2 py-1 bg-surface-variant bg-opacity-50">
                <v-checkbox
                  v-model="word.isMemorized"
                  @change="toggleMemorized(word)"
                  color="success"
                  hide-details
                  density="compact"
                  :label="word.isMemorized ? '암기 완료' : '미암기'"
                  class="font-weight-bold"
                ></v-checkbox>
              </div>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { collection, getDocs, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from 'vuetify';

const theme = useTheme();
const route = useRoute();

const filterDay = ref('');
const filterCategory = ref('');
const filterStatus = ref('all');
const wordsList = ref([]);
const selectedIds = ref([]);

const dayOptions = [{ title: '모든 날짜', value: '' }];
for (let i = 1; i <= 30; i++) {
  dayOptions.push({ title: `Day ${i}`, value: `Day ${i}` });
}

const categoryOptions = [
  { title: '모든 분류', value: '' },
  { title: '기본단어', value: '기본단어' },
  { title: '토익기초단어', value: '토익기초단어' },
  { title: '800단어', value: '800단어' },
  { title: '900단어', value: '900단어' }
];

const statusOptions = [
  { title: '모든 상태', value: 'all' },
  //{ title: '✅ 암기 완료', value: 'memorized' },
  { title: '암기 완료', value: 'memorized' },
  { title: '미암기', value: 'unmemorized' }
];

onMounted(async () => {
  if (route.query.day) {
    filterDay.value = route.query.day;
  }
  
  try {
    const q = query(collection(db, "words"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const dbWords = [];
    querySnapshot.forEach((doc) => {
      dbWords.push({
        id: doc.id,
        isMemorized: false,
        ...doc.data()
      });
    });
    
    wordsList.value = dbWords;
  } catch (error) {
    console.error("데이터 불러오기 에러:", error);
    alert("데이터를 불러오는데 실패했습니다.");
  }
});

const toggleMemorized = async (word) => {
  // v-model에 의해 word.isMemorized는 이미 새 값으로 변경되어 있음
  try {
    const wordRef = doc(db, "words", word.id);
    await updateDoc(wordRef, {
      isMemorized: word.isMemorized
    });
  } catch (error) {
    console.error("업데이트 에러:", error);
    word.isMemorized = !word.isMemorized; // 실패 시 롤백
    alert("상태 업데이트에 실패했습니다.");
  }
};

const deleteSelected = async () => {
  if (selectedIds.value.length === 0) return;
  
  const isDark = theme.global.current.value.dark;
  
  const result = await Swal.fire({
    title: '정말로 삭제할까요?',
    text: `선택한 ${selectedIds.value.length}개의 단어를 영구적으로 삭제합니다.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#9CA3AF',
    confirmButtonText: '삭제',
    cancelButtonText: '취소',
    background: isDark ? '#1F2937' : '#FFFFFF',
    color: isDark ? '#F9FAFB' : '#111827'
  });

  if (!result.isConfirmed) return;
  
  try {
    const batch = writeBatch(db);
    selectedIds.value.forEach(id => {
      const wordRef = doc(db, "words", id);
      batch.delete(wordRef);
    });
    
    await batch.commit();
    
    wordsList.value = wordsList.value.filter(word => !selectedIds.value.includes(word.id));
    selectedIds.value = [];
    
    Swal.fire({
      title: '삭제 완료!',
      text: '선택한 단어가 삭제되었습니다.',
      icon: 'success',
      confirmButtonColor: '#10B981',
      timer: 1500,
      showConfirmButton: false,
      background: isDark ? '#1F2937' : '#FFFFFF',
      color: isDark ? '#F9FAFB' : '#111827'
    });
  } catch (error) {
    console.error("다중 삭제 에러:", error);
    Swal.fire({
      title: '오류',
      text: '삭제에 실패했습니다.',
      icon: 'error',
      background: isDark ? '#1F2937' : '#FFFFFF',
      color: isDark ? '#F9FAFB' : '#111827'
    });
  }
};

const getCategoryColor = (category) => {
  switch(category) {
    case '기본단어': return '#10B981';
    case '토익기초단어': return '#3B82F6';
    case '800단어': return '#F59E0B';
    case '900단어': return '#EF4444';
    default: return '#6B7280';
  }
};

const getDayColor = (dayStr) => {
  if(!dayStr) return 'primary';
  const numMatches = dayStr.match(/\d+/);
  if (!numMatches) return 'primary';
  const day = parseInt(numMatches[0], 10);
  const hue = (day * 12) % 360;
  return `hsl(${hue}, 75%, 55%)`;
};

const filteredWords = computed(() => {
  return wordsList.value.filter(item => {
    const matchDay = filterDay.value === '' || item.day === filterDay.value;
    const matchCategory = filterCategory.value === '' || item.category === filterCategory.value;
    
    let matchStatus = true;
    if (filterStatus.value === 'memorized') matchStatus = item.isMemorized === true;
    if (filterStatus.value === 'unmemorized') matchStatus = item.isMemorized !== true;

    return matchDay && matchCategory && matchStatus;
  });
});
</script>

<style scoped>
.memorized-blur {
  opacity: 0.4;
  filter: blur(2px) grayscale(100%);
  pointer-events: none;
  user-select: none;
}
</style>
