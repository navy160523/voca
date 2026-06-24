<template>
  <v-container fluid class="pa-0 pa-sm-4 animate-fade-in fill-height d-flex flex-column justify-center study-container" style="max-width: 100%; width: 100%;">
    
    <!-- 1. Day 선택 화면 (쿼리에 Day가 없을 때만 표시) -->
    <v-card v-if="state === 'select_day'" elevation="3" rounded="xl" class="pa-5 w-100 my-auto mx-auto" style="max-width: 600px;">
      <div class="text-center mb-6">
        <v-icon size="48" color="primary" class="mb-2">mdi-book-open-page-variant</v-icon>
        <h1 class="text-h5 font-weight-black text-primary">학습할 Day 선택</h1>
        <p class="text-caption text-grey-darken-1">보고 싶은 날짜를 선택하여 바로 암기 카드를 띄웁니다.</p>
      </div>

      <div class="days-grid-v2">
        <v-btn
          v-for="n in 30"
          :key="n"
          color="primary"
          variant="outlined"
          rounded="lg"
          size="large"
          class="font-weight-bold"
          @click="selectDayFromGrid(`Day ${n}`)"
        >
          Day {{ n }}
        </v-btn>
      </div>
    </v-card>

    <!-- 2. 단어가 없을 때 화면 -->
    <v-card v-else-if="state === 'empty'" elevation="3" rounded="xl" class="pa-6 w-100 my-auto mx-auto text-center" style="max-width: 600px;">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-database-minus-outline</v-icon>
      <h2 class="text-h5 font-weight-bold mb-2">등록된 단어가 없습니다</h2>
      <p class="text-body-2 text-grey-darken-1 mb-6">해당 Day에 등록된 단어가 없습니다. 먼저 단어를 추가해 주세요.</p>
      <v-btn color="primary" rounded="pill" block size="large" to="/add">단어 등록하러 가기</v-btn>
    </v-card>

    <!-- 3. 암기 학습 카드 화면 -->
    <div v-else-if="state === 'active' && currentWord" class="w-100 d-flex flex-column justify-space-between fill-height study-active-layout py-1">
      <!-- 상단 바 -->
      <div class="d-flex align-center justify-space-between px-3 py-1 bg-transparent">
        <v-btn icon="mdi-home-outline" variant="text" color="grey-darken-3" to="/dashboard"></v-btn>
        
        <div class="d-flex align-center">
          <span class="text-subtitle-2 font-weight-black mr-3 text-primary">{{ currentDay }}</span>
          <!-- 라운드 정보 -->
          <v-chip color="primary" variant="flat" size="small" class="font-weight-bold mr-2">
            {{ currentRound }}회차
          </v-chip>
          <!-- 진도 표시 -->
          <v-chip color="success" variant="tonal" size="small" class="font-weight-bold">
            {{ completedCount }} / {{ totalSessionCount }}
          </v-chip>
          <!-- 되돌리기 -->
          <v-btn 
            icon="mdi-undo" 
            variant="text" 
            size="small" 
            color="grey-darken-1" 
            class="ml-2" 
            :disabled="history.length === 0" 
            @click="undoLastAction"
          ></v-btn>
        </div>

        <v-btn icon="mdi-dots-vertical" variant="text" color="grey-darken-3"></v-btn>
      </div>

      <!-- 메인 카드 (갤럭시 S22 Ultra에 특화된 시원시원한 세로 비율) -->
      <v-card 
        elevation="4" 
        rounded="xl" 
        class="ma-2 ma-sm-4 flex-grow-1 d-flex flex-column swipe-card" 
        :style="cardTransformStyle"
        style="overflow: hidden; max-height: calc(100vh - 160px); touch-action: none;"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      >
        <!-- Swipe Indicators -->
        <div v-if="offsetX < -20" class="swipe-indicator memorized-indicator">
          외움
        </div>
        <div v-if="offsetX > 20" class="swipe-indicator review-indicator">
          다시 외우기
        </div>

        <!-- 텍스트 내용 -->
        <v-card-text class="pa-5 d-flex flex-column justify-space-between flex-grow-1">
          <div>
            <!-- 단어명 & 발음 TTS -->
            <div class="d-flex align-center justify-space-between mb-1">
              <h2 class="text-h3 font-weight-black text-grey-darken-4 text-truncate word-title">
                {{ currentWord.word }}
              </h2>
              <v-btn 
                icon="mdi-volume-high" 
                variant="tonal" 
                color="primary" 
                size="small" 
                class="elevation-1"
                @click.stop="speakText(currentWord.word)"
              ></v-btn>
            </div>

            <!-- 발음기호 -->
            <div class="text-body-2 text-grey-darken-1 mb-4 font-italic">
              [{{ getApproximatedPronunciation(currentWord.word) }}]
            </div>

            <!-- 뜻 -->
            <div class="d-flex align-center mb-4">
              <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold mr-2 text-uppercase">
                {{ getPartOfSpeech(currentWord.meaning) }}
              </v-chip>
              <span class="text-h6 font-weight-bold text-grey-darken-3">{{ currentWord.meaning }}</span>
            </div>

            <!-- 예문 영역 (항상 직접 노출) -->
            <div class="border-t pt-4 mt-4">
              <div class="d-flex justify-space-between align-start mb-2">
                <p class="text-body-1 font-weight-medium text-grey-darken-3 pr-2" style="line-height: 1.4;">
                  <span v-html="highlightWord(currentWord.example || 'No example sentence provided.', currentWord.word)"></span>
                </p>
                <v-btn 
                  v-if="currentWord.example"
                  icon="mdi-volume-high" 
                  variant="text" 
                  color="grey-darken-2" 
                  size="x-small" 
                  @click.stop="speakText(currentWord.example)"
                ></v-btn>
              </div>

              <!-- 한글 해석 / 번역 (선택적 구글 번역 토글) -->
              <v-expand-transition>
                <div v-show="showTranslation">
                  <p v-if="currentWord.example" class="text-body-2 text-grey-darken-1 font-weight-bold">
                    {{ getKoreanTranslation(currentWord.example) }}
                  </p>
                </div>
              </v-expand-transition>
            </div>
          </div>

          <!-- 하단 분류 정보 및 번역 토글 버튼 -->
          <div class="d-flex justify-space-between align-center border-t pt-3 mt-4">
            <span class="text-caption text-grey-darken-1">{{ currentWord.category }}</span>
            <v-btn 
              variant="tonal" 
              size="small" 
              color="secondary" 
              rounded="pill" 
              class="font-weight-bold px-4" 
              prepend-icon="mdi-google-translate"
              @click.stop="showTranslation = !showTranslation"
            >
              {{ showTranslation ? '해석 숨기기' : '구글 번역 보기' }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- 하단 버튼 바 (드래그 외에 직관적인 탭용) -->
      <div class="d-flex gap-2 px-3 pb-2 w-100">
        <v-btn
          color="white"
          variant="flat"
          size="x-large"
          class="flex-grow-1 font-weight-bold border-sm"
          style="border-color: #E0E0E0 !important; color: #333333 !important; text-transform: none; font-size: 1.05rem; border-radius: 12px; height: 50px;"
          elevation="1"
          @click="triggerSwipeOut('left')"
        >
          외움 (왼쪽)
        </v-btn>
        <v-btn
          color="black"
          variant="flat"
          size="x-large"
          class="flex-grow-1 font-weight-bold text-white"
          style="text-transform: none; font-size: 1.05rem; border-radius: 12px; height: 50px;"
          elevation="2"
          @click="triggerSwipeOut('right')"
        >
          다시 외우기 (오른쪽)
        </v-btn>
      </div>
    </div>

    <!-- 4. 5회 완료 또는 올 클리어 시 선택 화면 -->
    <v-card v-else-if="state === 'finished' || state === 'round_limit'" elevation="3" rounded="xl" class="pa-6 w-100 my-auto mx-auto text-center animate-fade-in" style="max-width: 600px;">
      <v-icon size="64" :color="state === 'finished' ? 'success' : 'warning'" class="mb-4">
        {{ state === 'finished' ? 'mdi-party-popper' : 'mdi-alert-circle-outline' }}
      </v-icon>
      
      <h1 class="text-h4 font-weight-black mb-2">
        {{ state === 'finished' ? '학습 완료!' : '5회 학습 도달!' }}
      </h1>
      
      <p class="text-body-1 text-grey-darken-2 mb-6">
        {{ state === 'finished' ? '이 날의 단어를 모두 외우셨습니다!' : '회독수가 5회에 도달했습니다. 미암기된 단어가 남아 있습니다.' }}
      </p>

      <v-card variant="tonal" :color="state === 'finished' ? 'success' : 'warning'" class="pa-4 mb-6 rounded-lg">
        <div class="d-flex justify-space-around">
          <div>
            <div class="text-h5 font-weight-black">{{ totalSessionCount }}</div>
            <div class="text-caption">총 단어 수</div>
          </div>
          <v-divider vertical></v-divider>
          <div>
            <div class="text-h5 font-weight-black text-error">{{ failedCount }}</div>
            <div class="text-caption text-error">미암기 단어</div>
          </div>
        </div>
      </v-card>

      <div class="d-flex flex-column gap-3">
        <!-- 5회 도달시의 선택지 -->
        <template v-if="state === 'round_limit'">
          <v-btn
            color="primary"
            size="large"
            rounded="pill"
            block
            class="font-weight-bold"
            prepend-icon="mdi-exit-run"
            @click="finishKeepingUnmemorized"
          >
            못외운 단어만 남겨두고 종료
          </v-btn>
          <v-btn
            color="error"
            variant="outlined"
            size="large"
            rounded="pill"
            block
            class="font-weight-bold"
            prepend-icon="mdi-refresh"
            @click="finishResettingAll"
          >
            모두 미암기로 리셋하고 종료
          </v-btn>
        </template>
        <!-- 완독 시의 선택지 -->
        <template v-else>
          <v-btn
            color="primary"
            size="large"
            rounded="pill"
            block
            class="font-weight-bold"
            prepend-icon="mdi-arrow-left"
            to="/dashboard"
          >
            대시보드로 돌아가기
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            size="large"
            rounded="pill"
            block
            class="font-weight-bold"
            prepend-icon="mdi-refresh"
            @click="restartSession"
          >
            처음부터 다시 학습하기
          </v-btn>
        </template>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, getDocs, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

// 상태 관리
const state = ref('select_day'); // 'select_day' | 'empty' | 'active' | 'finished' | 'round_limit'
const currentDay = ref('');

// 단어 큐 관련
const fullSessionWords = ref([]); // 원본 단어들
const roundQueue = ref([]); // 현재 회차에 돌릴 단어 큐
const nextRoundQueue = ref([]); // 틀려서 다음 회차에 넘어갈 단어 큐
const currentRound = ref(1);
const history = ref([]);
const completedCount = ref(0);
const showTranslation = ref(false);
const isBookmarked = ref(false);

const totalSessionCount = computed(() => fullSessionWords.value.length);
const failedCount = computed(() => {
  // 현재 큐 + 다음 회차용 큐에 들어있는 고유 단어 수
  const uniqueFailed = new Set([
    ...roundQueue.value.map(w => w.id),
    ...nextRoundQueue.value.map(w => w.id)
  ]);
  return uniqueFailed.size;
});

const currentWord = computed(() => {
  if (roundQueue.value.length === 0) return null;
  return roundQueue.value[0];
});

// 제스처 스와이프 제어
const isDragging = ref(false);
const startX = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const isSwipingOut = ref(false);
const swipeDirection = ref(''); // 'left' | 'right'

const cardTransformStyle = computed(() => {
  if (isSwipingOut.value) {
    const translateDir = swipeDirection.value === 'left' ? '-150%' : '150%';
    const rot = swipeDirection.value === 'left' ? -20 : 20;
    return {
      transform: `translate3d(${translateDir}, 0px, 0) rotate(${rot}deg)`,
      transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      pointerEvents: 'none'
    };
  }
  
  if (isDragging.value) {
    const rotate = offsetX.value * 0.05;
    return {
      transform: `translate3d(${offsetX.value}px, ${offsetY.value * 0.2}px, 0) rotate(${rotate}deg)`,
      transition: 'none',
      cursor: 'grabbing'
    };
  }
  
  return {
    transform: 'translate3d(0px, 0px, 0) rotate(0deg)',
    transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: 'grab'
  };
});

const dragStart = (clientX) => {
  if (isSwipingOut.value) return;
  isDragging.value = true;
  startX.value = clientX;
  offsetX.value = 0;
  offsetY.value = 0;
};

const dragMove = (clientX) => {
  if (!isDragging.value) return;
  offsetX.value = clientX - startX.value;
};

const dragEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  
  const threshold = 110;
  if (offsetX.value < -threshold) {
    triggerSwipeOut('left'); // 외움
  } else if (offsetX.value > threshold) {
    triggerSwipeOut('right'); // 다시외우기
  } else {
    offsetX.value = 0;
    offsetY.value = 0;
  }
};

const triggerSwipeOut = (direction) => {
  if (isSwipingOut.value) return;
  isSwipingOut.value = true;
  swipeDirection.value = direction;
  
  setTimeout(async () => {
    if (direction === 'left') {
      await markAsMemorized();
    } else {
      markForReview();
    }
    offsetX.value = 0;
    offsetY.value = 0;
    isSwipingOut.value = false;
    swipeDirection.value = '';
  }, 350);
};

// 터치/마우스 바인딩
const onTouchStart = (e) => { if (e.touches && e.touches[0]) dragStart(e.touches[0].clientX); };
const onTouchMove = (e) => { if (e.touches && e.touches[0]) dragMove(e.touches[0].clientX); };
const onTouchEnd = () => dragEnd();
const onMouseDown = (e) => dragStart(e.clientX);
const onMouseMove = (e) => { if (e.buttons === 1) dragMove(e.clientX); };
const onMouseUp = () => dragEnd();

// Day 그리드에서 바로 들어왔을 때
const selectDayFromGrid = (dayName) => {
  router.push({ path: '/words', query: { day: dayName } });
  loadWordsForDay(dayName);
};

// 단어 로드
const loadWordsForDay = async (dayName) => {
  currentDay.value = dayName;
  state.value = 'loading';
  
  try {
    const q = query(
      collection(db, "words"),
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

    // 초기 셔플
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    fullSessionWords.value = words;
    roundQueue.value = [...words];
    nextRoundQueue.value = [];
    currentRound.value = 1;
    completedCount.value = 0;
    history.value = [];
    state.value = 'active';
  } catch (error) {
    console.error("단어 로딩 실패:", error);
    state.value = 'empty';
  }
};

onMounted(() => {
  if (route.query.day) {
    loadWordsForDay(route.query.day);
  } else {
    state.value = 'select_day';
  }
});

// 상호작용 로직
const markAsMemorized = async () => {
  if (roundQueue.value.length === 0) return;
  const word = roundQueue.value[0];

  history.value.push({
    action: 'memorized',
    word: word,
    originalState: word.isMemorized,
    round: currentRound.value
  });

  // DB 업데이트
  try {
    const docRef = doc(db, "words", word.id);
    await updateDoc(docRef, { isMemorized: true });
    word.isMemorized = true;
  } catch (e) {
    console.error(e);
  }

  roundQueue.value.shift();
  completedCount.value++;
  showTranslation.value = false;
  isBookmarked.value = false;

  checkRoundStatus();
};

const markForReview = () => {
  if (roundQueue.value.length === 0) return;
  const word = roundQueue.value[0];

  history.value.push({
    action: 'review',
    word: word,
    round: currentRound.value
  });

  // 이번 턴에서 빼서 다음 회차 큐에 보관
  roundQueue.value.shift();
  nextRoundQueue.value.push(word);
  
  showTranslation.value = false;
  isBookmarked.value = false;

  checkRoundStatus();
};

const checkRoundStatus = () => {
  if (roundQueue.value.length === 0) {
    // 한 회차가 끝났을 때
    if (nextRoundQueue.value.length === 0) {
      // 모든 단어를 다 외운 경우
      state.value = 'finished';
    } else {
      // 다음 회차로 진입
      if (currentRound.value >= 5) {
        // 5회 돌았을 때 미암기 카드가 남았으므로 종료 선택지 창 노출
        state.value = 'round_limit';
      } else {
        // 다음 회차 진행
        currentRound.value++;
        // 다음 라운드 큐 셔플
        const nextWords = [...nextRoundQueue.value];
        for (let i = nextWords.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [nextWords[i], nextWords[j]] = [nextWords[j], nextWords[i]];
        }
        roundQueue.value = nextWords;
        nextRoundQueue.value = [];
      }
    }
  }
};

// 5회 돌았을 때의 처리
const finishKeepingUnmemorized = () => {
  // 현재 상태 유지하고 종료
  Swal.fire({
    title: '학습 완료',
    text: '외운 단어 상태를 유지한 채 학습을 종료합니다.',
    icon: 'success',
    confirmButtonColor: '#10B981'
  }).then(() => {
    router.push('/dashboard');
  });
};

const finishResettingAll = async () => {
  // 이 세션의 모든 단어를 다시 미암기로 갱신하고 종료
  try {
    const batch = writeBatch(db);
    fullSessionWords.value.forEach(word => {
      const docRef = doc(db, "words", word.id);
      batch.update(docRef, { isMemorized: false });
    });
    await batch.commit();

    Swal.fire({
      title: '리셋 완료',
      text: '모든 단어가 다시 미암기 상태로 초기화되었습니다.',
      icon: 'info',
      confirmButtonColor: '#4F46E5'
    }).then(() => {
      router.push('/dashboard');
    });
  } catch (e) {
    console.error(e);
    Swal.fire({ icon: 'error', title: '오류', text: '리셋 도중 실패했습니다.' });
  }
};

const undoLastAction = async () => {
  if (history.value.length === 0) return;
  const last = history.value.pop();

  if (last.round !== currentRound.value) {
    // 라운드가 이미 넘어간 경우에는 되돌리기를 막거나 이전 라운드로 환원
    currentRound.value = last.round;
    // 다음 라운드 큐로 넘어갔던 것들을 복원하기 위해 정렬
    roundQueue.value = [...roundQueue.value, ...nextRoundQueue.value];
    nextRoundQueue.value = [];
  }

  if (last.action === 'memorized') {
    try {
      const docRef = doc(db, "words", last.word.id);
      await updateDoc(docRef, { isMemorized: last.originalState });
      last.word.isMemorized = last.originalState;
    } catch (e) {
      console.error(e);
    }
    roundQueue.value.unshift(last.word);
    completedCount.value = Math.max(0, completedCount.value - 1);
  } else if (last.action === 'review') {
    // nextRoundQueue 끝에 들어간 단어를 다시 꺼내서 맨 앞에 넣음
    const idx = nextRoundQueue.value.indexOf(last.word);
    if (idx > -1) {
      nextRoundQueue.value.splice(idx, 1);
    }
    roundQueue.value.unshift(last.word);
  }

  showTranslation.value = false;
  isBookmarked.value = false;
};

const restartSession = () => {
  loadWordsForDay(currentDay.value);
};

// 발음 및 부가도구
const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

const highlightWord = (sentence, targetWord) => {
  if (!sentence || !targetWord) return sentence;
  const escapedTarget = targetWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\b(${escapedTarget}[a-z]*)\\b`, 'gi');
  return sentence.replace(regex, '<strong>$1</strong>');
};

const getKoreanTranslation = (sentence) => {
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]+.*/;
  const match = sentence.match(koreanRegex);
  return match ? match[0] : '번역문 정보가 예문에 없습니다.';
};

const getPartOfSpeech = (meaning) => {
  if (!meaning) return 'n';
  const text = meaning.trim();
  if (text.endsWith('다')) return 'v';
  if (text.endsWith('한') || text.endsWith('는') || text.endsWith('운')) return 'adj';
  if (text.endsWith('히') || text.endsWith('게')) return 'adv';
  return 'n';
};

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

const excludeWord = () => {
  Swal.fire({
    title: '학습 제외',
    text: '이 단어를 이번 학습에서 제외(외움 처리)하시겠습니까?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    confirmButtonText: '제외',
    cancelButtonText: '취소'
  }).then((result) => {
    if (result.isConfirmed) {
      markAsMemorized();
    }
  });
};
</script>

<style scoped>
.study-container {
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


.bookmark-btn {
  z-index: 2;
  transition: all 0.2s ease;
}

.word-title {
  letter-spacing: -1px;
  line-height: 1.1;
}

.border-sm {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}

.swipe-card {
  position: relative;
  user-select: none;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.swipe-indicator {
  position: absolute;
  top: 40px;
  padding: 10px 20px;
  font-size: 1.6rem;
  font-weight: 900;
  border-radius: 8px;
  border: 4px solid;
  z-index: 10;
  pointer-events: none;
  text-transform: uppercase;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.memorized-indicator {
  left: 20px;
  color: #10B981;
  border-color: #10B981;
  transform: rotate(-12deg);
}

.review-indicator {
  right: 20px;
  color: #111111;
  border-color: #111111;
  transform: rotate(12deg);
}
</style>
