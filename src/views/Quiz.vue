<template>
  <v-container fluid class="pa-0 pa-sm-4 animate-fade-in fill-height d-flex flex-column justify-center quiz-container" style="max-width: 100%; width: 100%;">
    
    <!-- 1. 설정 및 Day 선택 화면 -->
    <v-card v-if="state === 'setup'" elevation="3" rounded="xl" class="pa-5 w-100 my-auto mx-auto" style="max-width: 600px;">
      <div class="text-center mb-6">
        <v-icon size="48" color="primary" class="mb-2">mdi-help-circle-outline</v-icon>
        <h1 class="text-h5 font-weight-black text-primary">단어 퀴즈 (4지선다)</h1>
        <p class="text-caption text-grey-darken-1">카테고리와 Day를 선택하여 4지선다 테스트를 시작합니다.</p>
      </div>

      <!-- 카테고리 선택 -->
      <div class="mb-4">
        <div class="text-subtitle-2 font-weight-bold mb-1">카테고리 선택</div>
        <v-chip-group v-model="selectedCategory" selected-class="text-white" mandatory>
          <v-chip
            v-for="cat in categories"
            :key="cat"
            :value="cat"
            :color="getCategoryColor(cat)"
            :variant="selectedCategory === cat ? 'flat' : 'outlined'"
            size="small"
            class="font-weight-bold"
          >
            {{ cat }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Day 선택 그리드 -->
      <div class="mb-4">
        <div class="text-subtitle-2 font-weight-bold mb-2">학습할 Day 선택</div>
        <div class="days-grid-v2">
          <v-btn
            v-for="n in 30"
            :key="n"
            color="primary"
            variant="outlined"
            rounded="lg"
            size="large"
            class="font-weight-bold"
            :loading="isLoadingWords && activeLoadingDay === `Day ${n}`"
            @click="startQuiz(`Day ${n}`)"
          >
            Day {{ n }}
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- 2. 단어가 없을 때 화면 -->
    <v-card v-else-if="state === 'empty'" elevation="3" rounded="xl" class="pa-6 w-100 my-auto mx-auto text-center" style="max-width: 600px;">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-database-minus-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mb-2">등록된 단어가 없습니다</h2>
      <p class="text-body-2 text-grey-darken-1 mb-6">해당 Day에 등록된 단어가 없습니다. 먼저 단어를 추가해 주세요.</p>
      <v-btn color="primary" rounded="pill" block size="large" @click="state = 'setup'">돌아가기</v-btn>
    </v-card>

    <!-- 3. 퀴즈 진행 화면 -->
    <div v-else-if="state === 'active' && currentQuestion" class="w-100 d-flex flex-column justify-space-between fill-height quiz-active-layout py-1">
      <!-- 상단 컨트롤 바 -->
      <div class="d-flex align-center justify-space-between px-3 py-1 bg-transparent">
        <v-btn icon="mdi-chevron-left" variant="text" color="grey-darken-3" @click="confirmExit"></v-btn>
        
        <div class="d-flex align-center">
          <span class="text-subtitle-2 font-weight-black mr-3 text-primary">{{ currentDay }}</span>
          <v-chip color="success" variant="flat" size="small" class="font-weight-bold px-3">
            {{ currentIndex + 1 }} / {{ quizWords.length }}
          </v-chip>
        </div>

        <v-btn icon="mdi-volume-high" variant="text" color="primary" @click="speakText(currentQuestion.word)"></v-btn>
      </div>

      <!-- 문제 카드 영역 -->
      <v-card 
        elevation="4" 
        rounded="xl" 
        class="ma-2 ma-sm-4 flex-grow-1 d-flex flex-column justify-center pa-6 text-center" 
        style="max-height: calc(100vh - 360px);"
      >
        <div class="text-caption text-grey-darken-1 mb-2">{{ selectedCategory }} · {{ currentDay }}</div>
        <h2 class="text-h2 font-weight-black text-grey-darken-4 word-title mb-2">
          {{ currentQuestion.word }}
        </h2>
        <div class="text-body-2 text-grey-darken-1 font-italic mb-4">
          [{{ getApproximatedPronunciation(currentQuestion.word) }}]
        </div>
      </v-card>

      <!-- 4지선다 버튼 영역 -->
      <div class="px-3 pb-4 d-flex flex-column gap-2 w-100">
        <v-btn
          v-for="(choice, idx) in currentChoices"
          :key="idx"
          block
          size="x-large"
          variant="flat"
          :color="getChoiceColor(choice)"
          class="choice-btn font-weight-bold py-4 text-left justify-start"
          style="text-transform: none; border-radius: 12px; height: 56px; border: 1px solid #E0E0E0 !important;"
          :disabled="hasAnswered"
          @click="selectAnswer(choice)"
        >
          <span class="mr-3 font-weight-black text-primary">{{ idx + 1 }}.</span>
          <span class="text-truncate">{{ choice }}</span>
          <v-spacer></v-spacer>
          <v-icon v-if="hasAnswered && choice === currentQuestion.meaning" color="success">mdi-check-circle</v-icon>
          <v-icon v-else-if="hasAnswered && selectedChoice === choice && choice !== currentQuestion.meaning" color="error">mdi-close-circle</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- 4. 결과 화면 -->
    <v-card v-else-if="state === 'finished'" elevation="3" rounded="xl" class="pa-6 w-100 my-auto mx-auto text-center animate-fade-in" style="max-width: 600px;">
      <v-icon size="64" :color="scorePercentage >= 60 ? 'success' : 'warning'" class="mb-4">
        {{ scorePercentage >= 80 ? 'mdi-party-popper' : scorePercentage >= 60 ? 'mdi-emoticon-happy-outline' : 'mdi-emoticon-sad-outline' }}
      </v-icon>
      
      <h1 class="text-h4 font-weight-black mb-2">테스트 결과</h1>
      <p class="text-body-1 text-grey-darken-2 mb-4">선택하신 분량의 퀴즈를 모두 완료했습니다.</p>

      <v-card variant="tonal" :color="scorePercentage >= 60 ? 'success' : 'warning'" class="pa-4 mb-6 rounded-lg">
        <div class="d-flex justify-space-around">
          <div>
            <div class="text-h5 font-weight-black">{{ quizWords.length }}</div>
            <div class="text-caption">총 문제</div>
          </div>
          <v-divider vertical></v-divider>
          <div>
            <div class="text-h5 font-weight-black text-success">{{ correctCount }}</div>
            <div class="text-caption text-success">맞힘</div>
          </div>
          <v-divider vertical></v-divider>
          <div>
            <div class="text-h5 font-weight-black text-error">{{ wrongWords.length }}</div>
            <div class="text-caption text-error">틀림</div>
          </div>
        </div>
      </v-card>

      <!-- 틀린 단어 복습 리스트 -->
      <div v-if="wrongWords.length > 0" class="text-left mb-6">
        <div class="text-subtitle-2 font-weight-bold mb-2 text-error">틀린 단어 오답 노트</div>
        <v-card variant="outlined" rounded="lg" class="pa-2" style="max-height: 180px; overflow-y: auto;">
          <v-list density="compact" class="bg-transparent">
            <v-list-item
              v-for="w in wrongWords"
              :key="w.id"
              class="border-b-sm py-1"
            >
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-bold text-grey-darken-4">{{ w.word }}</span>
                <span class="text-caption text-grey-darken-1">{{ w.meaning }}</span>
              </div>
            </v-list-item>
          </v-list>
        </v-card>
      </div>

      <div class="d-flex flex-column gap-3">
        <v-btn
          color="primary"
          size="large"
          rounded="pill"
          block
          class="font-weight-bold"
          prepend-icon="mdi-reload"
          @click="restartQuiz"
        >
          다시 도전하기
        </v-btn>
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          rounded="pill"
          block
          class="font-weight-bold"
          prepend-icon="mdi-home-outline"
          @click="state = 'setup'"
        >
          다른 Day 선택하기
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';

const categories = ['기본단어', '토익기초단어', '800단어', '900단어'];
const selectedCategory = ref('기본단어');

const state = ref('setup'); // 'setup' | 'empty' | 'active' | 'finished'
const currentDay = ref('');
const activeLoadingDay = ref('');
const isLoadingWords = ref(false);

const quizWords = ref([]); // 전체 출제 단어 리스트
const currentIndex = ref(0); // 현재 문제 번호
const correctCount = ref(0); // 맞춘 개수
const wrongWords = ref([]); // 틀린 단어 기록용

// 선택지 관련
const currentChoices = ref([]);
const selectedChoice = ref(null);
const hasAnswered = ref(false);

const currentQuestion = computed(() => {
  if (quizWords.value.length === 0 || currentIndex.value >= quizWords.value.length) return null;
  return quizWords.value[currentIndex.value];
});

const scorePercentage = computed(() => {
  if (quizWords.value.length === 0) return 0;
  return Math.round((correctCount.value / quizWords.value.length) * 100);
});

// 카테고리 색상
const getCategoryColor = (cat) => {
  switch(cat) {
    case '기본단어': return '#10B981';
    case '토익기초단어': return '#3B82F6';
    case '800단어': return '#F59E0B';
    case '900단어': return '#EF4444';
    default: return 'primary';
  }
};

// 가상 발음기호 생성기
const getApproximatedPronunciation = (word) => {
  if (!word) return '';
  const dict = {
    'notify': 'nóutəfài',
    'susceptible': 'səséptəbl',
    'vulnerable': 'vʌ́lnərəbl',
    'anticipate': 'æntísəpèit'
  };
  return dict[word.toLowerCase()] || `${word.toLowerCase()}́`;
};

// 퀴즈 시작 (단어 데이터 패치)
const startQuiz = async (dayName) => {
  currentDay.value = dayName;
  activeLoadingDay.value = dayName;
  isLoadingWords.value = true;

  try {
    // 1. 해당 Day와 카테고리에 있는 단어들 가져오기
    const q = query(
      collection(db, "words"),
      where("category", "==", selectedCategory.value),
      where("day", "==", dayName)
    );
    const querySnapshot = await getDocs(q);
    
    const words = [];
    querySnapshot.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() });
    });

    if (words.length === 0) {
      state.value = 'empty';
      return;
    }

    // 2. 전체 카테고리 단어 리스트 가져오기 (오답 보기를 만드는 용도)
    const allQ = query(
      collection(db, "words"),
      where("category", "==", selectedCategory.value)
    );
    const allSnapshot = await getDocs(allQ);
    const allMeanings = [];
    allSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.meaning && !allMeanings.includes(data.meaning)) {
        allMeanings.push(data.meaning);
      }
    });

    // 3. 문제 셔플
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    // 최대 10문제 또는 20문제로 제한하거나 전체 출제 가능
    quizWords.value = words;
    currentIndex.value = 0;
    correctCount.value = 0;
    wrongWords.value = [];
    state.value = 'active';

    generateChoices(allMeanings);

  } catch (error) {
    console.error("퀴즈 로딩 실패:", error);
    Swal.fire({ icon: 'error', title: '오류', text: '문제를 로드하지 못했습니다.' });
  } finally {
    isLoadingWords.value = false;
    activeLoadingDay.value = '';
  }
};

// 4지선다 보기 생성
const generateChoices = (allMeanings) => {
  const current = currentQuestion.value;
  if (!current) return;

  const choices = new Set();
  choices.add(current.meaning);

  // 해당 카테고리 전체 뜻 목록 중에서 랜덤하게 오답 보기 추가
  const otherMeanings = allMeanings.filter(m => m !== current.meaning);
  
  while (choices.size < 4 && otherMeanings.length > 0) {
    const randomIdx = Math.floor(Math.random() * otherMeanings.length);
    choices.add(otherMeanings[randomIdx]);
  }

  // 셔플하여 보기 배열 생성
  const choicesArr = Array.from(choices);
  for (let i = choicesArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choicesArr[i], choicesArr[j]] = [choicesArr[j], choicesArr[i]];
  }

  currentChoices.value = choicesArr;
  selectedChoice.value = null;
  hasAnswered.value = false;

  // TTS 자동 발음 재생
  speakText(current.word);
};

// 답변 선택 핸들러
const selectAnswer = (choice) => {
  if (hasAnswered.value) return;

  selectedChoice.value = choice;
  hasAnswered.value = true;

  const current = currentQuestion.value;
  if (choice === current.meaning) {
    correctCount.value++;
  } else {
    wrongWords.value.push(current);
  }

  // 1.5초 후 다음 문제로 진행
  setTimeout(() => {
    goToNextQuestion();
  }, 1500);
};

const goToNextQuestion = () => {
  if (currentIndex.value < quizWords.value.length - 1) {
    currentIndex.value++;
    // 다시 오답보기를 만들기 위해 전체 뜻 목록을 보강
    const allMeanings = quizWords.value.map(w => w.meaning);
    generateChoices(allMeanings);
  } else {
    state.value = 'finished';
  }
};

// 버튼 색상 피드백
const getChoiceColor = (choice) => {
  if (!hasAnswered.value) return 'white';
  
  const current = currentQuestion.value;
  if (choice === current.meaning) {
    return 'success'; // 정답은 언제나 초록
  }
  if (selectedChoice.value === choice && choice !== current.meaning) {
    return 'error'; // 내가 오답을 골랐다면 빨강
  }
  return 'white';
};

// TTS 발음 듣기
const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

const confirmExit = () => {
  Swal.fire({
    title: '퀴즈 중단',
    text: '정말로 퀴즈를 중단하고 메인으로 돌아가시겠습니까?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#6B7280',
    confirmButtonText: '중단',
    cancelButtonText: '취소'
  }).then((result) => {
    if (result.isConfirmed) {
      state.value = 'setup';
    }
  });
};

const restartQuiz = () => {
  startQuiz(currentDay.value);
};
</script>

<script>
export default {
  name: 'QuizMode'
}
</script>

<style scoped>
.quiz-container {
  min-height: 100vh;
}

.days-grid-v2 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

@media (min-width: 600px) {
  .days-grid-v2 {
    grid-template-columns: repeat(5, 1fr);
  }
}

.choice-btn {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  text-align: left !important;
  justify-content: flex-start !important;
  transition: all 0.2s ease;
}

.choice-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.word-title {
  letter-spacing: -1px;
  line-height: 1.1;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.border-b-sm {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}
</style>
