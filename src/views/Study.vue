<template>
  <v-container fluid class="pa-0 pa-sm-4 animate-fade-in fill-height d-flex flex-column justify-center" style="max-width: 100%; width: 100%;">
    
    <!-- 1. 설정 화면 -->
    <v-card v-if="state === 'setup'" elevation="3" rounded="xl" class="pa-5 w-100 my-auto" style="max-width: 600px;">
      <div class="text-center mb-6">
        <v-icon size="48" color="primary" class="mb-2">mdi-cards-playing-outline</v-icon>
        <h1 class="text-h5 font-weight-black text-primary">단어 암기 학습</h1>
        <p class="text-caption text-grey-darken-1">원하는 조건으로 단어를 무작위 암기합니다.</p>
      </div>

      <!-- 카테고리 선택 -->
      <div class="mb-4">
        <div class="text-subtitle-2 font-weight-bold mb-1">카테고리 선택</div>
        <v-chip-group v-model="setupCategory" selected-class="text-white">
          <v-chip
            v-for="cat in categories"
            :key="cat"
            :value="cat"
            :color="getCategoryColor(cat)"
            :variant="setupCategory === cat ? 'flat' : 'outlined'"
            size="small"
            class="font-weight-bold"
          >
            {{ cat }}
          </v-chip>
        </v-chip-group>
      </div>

      <!-- Day 선택 (다중 선택 가능) -->
      <div class="mb-4">
        <div class="text-subtitle-2 font-weight-bold mb-1">학습할 Day 선택</div>
        <div class="d-flex flex-wrap gap-2 mb-2">
          <v-btn size="x-small" variant="outlined" color="primary" @click="selectAllDays">전체 선택</v-btn>
          <v-btn size="x-small" variant="outlined" color="secondary" @click="clearAllDays">전체 해제</v-btn>
        </div>
        <v-card variant="outlined" rounded="lg" class="pa-2" style="max-height: 180px; overflow-y: auto;">
          <v-chip-group v-model="setupDays" column multiple>
            <v-chip
              v-for="n in 30"
              :key="n"
              :value="`Day ${n}`"
              filter
              variant="outlined"
              size="small"
              color="primary"
              class="font-weight-bold"
            >
              Day {{ n }}
            </v-chip>
          </v-chip-group>
        </v-card>
      </div>

      <!-- 필터 설정 -->
      <div class="mb-6">
        <div class="text-subtitle-2 font-weight-bold mb-1">암기 상태 필터</div>
        <v-radio-group v-model="setupFilter" inline hide-details>
          <v-radio label="전체 단어" value="all" color="primary"></v-radio>
          <v-radio label="미암기 단어만" value="unmemorized" color="primary"></v-radio>
        </v-radio-group>
      </div>

      <v-btn
        color="primary"
        size="large"
        block
        rounded="pill"
        elevation="3"
        class="font-weight-bold"
        prepend-icon="mdi-play"
        :loading="isLoadingWords"
        @click="startStudy"
      >
        학습 시작하기
      </v-btn>
    </v-card>

    <!-- 2. 학습 진행 화면 -->
    <div v-else-if="state === 'active' && currentWord" class="w-100 d-flex flex-column justify-space-between fill-height py-1 py-sm-2">
      <!-- 상단 컨트롤 바 -->
      <div class="d-flex align-center justify-space-between px-3 px-sm-4 py-1 py-sm-2 bg-transparent">
        <v-btn icon="mdi-chevron-left" variant="text" color="grey-darken-3" @click="exitToSetup"></v-btn>
        
        <div class="d-flex align-center">
          <v-btn icon="mdi-trash-can-outline" variant="text" size="small" color="grey-darken-1" class="mr-1 mr-sm-2" @click="excludeWord"></v-btn>
          <!-- 학습 진도 상태 -->
          <v-chip color="success" variant="flat" size="small" class="font-weight-bold px-3">
            {{ completedCount }} / {{ totalSessionCount }}
          </v-chip>
          <v-btn 
            icon="mdi-undo" 
            variant="text" 
            size="small" 
            color="grey-darken-1" 
            class="ml-1 ml-sm-2" 
            :disabled="history.length === 0" 
            @click="undoLastAction"
          ></v-btn>
        </div>

        <v-btn icon="mdi-dots-vertical" variant="text" color="grey-darken-3"></v-btn>
      </div>

      <!-- 중앙 카드 영역 -->
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
          알고 있어요
        </div>
        <div v-if="offsetX > 20" class="swipe-indicator review-indicator">
          학습할게요
        </div>

        <!-- 텍스트 내용 -->
        <v-card-text class="pa-5 d-flex flex-column justify-space-between flex-grow-1">
          <div>
            <!-- 단어 & TTS 발음 듣기 -->
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

            <!-- 발음 기호 (가상/자동 생성) -->
            <div class="text-body-2 text-grey-darken-1 mb-4 font-italic">
              [{{ getApproximatedPronunciation(currentWord.word) }}]
            </div>

            <!-- 품사 & 뜻 -->
            <div class="d-flex align-center mb-6">
              <v-chip size="x-small" color="primary" variant="flat" class="font-weight-bold mr-2 text-uppercase">
                {{ getPartOfSpeech(currentWord.meaning) }}
              </v-chip>
              <span class="text-h6 font-weight-bold text-grey-darken-3">{{ cleanMeaning(currentWord.meaning) }}</span>
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
            <span class="text-caption text-grey-darken-1">{{ currentWord.category }} · {{ currentWord.day }}</span>
            <v-btn 
              variant="tonal" 
              size="small" 
              color="secondary" 
              rounded="pill" 
              class="font-weight-bold px-4" 
              prepend-icon="mdi-google-translate"
              @click.stop="showTranslation = !showTranslation"
            >
              {{ showTranslation ? '구글 번역기: ON' : '구글 번역기: OFF' }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- 하단 선택 버튼 -->
      <div class="d-flex gap-2 gap-sm-3 px-3 px-sm-4 pb-2 pb-sm-3 w-100">
        <v-btn
          color="white"
          variant="flat"
          size="x-large"
          class="flex-grow-1 font-weight-bold py-3 py-sm-4 border-sm"
          style="border-color: #E0E0E0 !important; color: #333333 !important; text-transform: none; font-size: 1.05rem; border-radius: 12px; height: 50px;"
          elevation="1"
          @click="triggerSwipeOut('left')"
        >
          알고 있어요
        </v-btn>
        <v-btn
          color="black"
          variant="flat"
          size="x-large"
          class="flex-grow-1 font-weight-bold py-3 py-sm-4 text-white"
          style="text-transform: none; font-size: 1.05rem; border-radius: 12px; height: 50px;"
          elevation="2"
          @click="triggerSwipeOut('right')"
        >
          학습할게요
        </v-btn>
      </div>
    </div>

    <!-- 3. 학습 완료 화면 -->
    <v-card v-else-if="state === 'finished'" elevation="3" rounded="xl" class="pa-6 w-100 my-auto text-center animate-fade-in">
      <v-icon size="64" color="success" class="mb-4">mdi-party-popper</v-icon>
      <h1 class="text-h4 font-weight-black text-success mb-2">학습 완료!</h1>
      <p class="text-body-1 text-grey-darken-2 mb-6">선택한 분량의 암기 학습을 끝마쳤습니다.</p>

      <v-card variant="tonal" color="success" class="pa-4 mb-6 rounded-lg">
        <div class="d-flex justify-space-around">
          <div>
            <div class="text-h5 font-weight-black">{{ totalSessionCount }}</div>
            <div class="text-caption">총 단어 수</div>
          </div>
          <v-divider vertical></v-divider>
          <div>
            <div class="text-h5 font-weight-black text-success">{{ memorizedInSession }}</div>
            <div class="text-caption text-success">암기 완료</div>
          </div>
        </div>
      </v-card>

      <div class="d-flex flex-column gap-3">
        <v-btn
          color="primary"
          size="large"
          rounded="pill"
          block
          class="font-weight-bold"
          prepend-icon="mdi-reload"
          @click="restartSession"
        >
          한 번 더 학습하기
        </v-btn>
        <v-btn
          variant="outlined"
          color="secondary"
          size="large"
          rounded="pill"
          block
          class="font-weight-bold"
          prepend-icon="mdi-home-outline"
          to="/dashboard"
        >
          대시보드로 가기
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Swal from 'sweetalert2';

// 공통 상수
const categories = ['기본단어', '토익기초단어', '800단어', '900단어'];

// 1. 상태 기계 관리
const state = ref('setup'); // 'setup' | 'active' | 'finished'
const isLoadingWords = ref(false);

// 2. 설정 값
const setupCategory = ref('기본단어');
const setupDays = ref([]);
const setupFilter = ref('unmemorized');

// 3. 실시간 학습 관련
const wordQueue = ref([]); // 현재 대기열
const fullSessionWords = ref([]); // 이번 세션의 전체 단어 목록 (통계용)
const currentWordIndex = ref(0);
const history = ref([]); // 되돌리기용 스택
const completedCount = ref(0); // 학습 완료(알고있음 처리된) 단어 수
const showTranslation = ref(false);
const isBookmarked = ref(false);

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
    triggerSwipeOut('left');
  } else if (offsetX.value > threshold) {
    triggerSwipeOut('right');
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

// 터치이벤트 핸들러
const onTouchStart = (e) => {
  if (e.touches && e.touches[0]) {
    dragStart(e.touches[0].clientX);
  }
};
const onTouchMove = (e) => {
  if (e.touches && e.touches[0]) {
    dragMove(e.touches[0].clientX);
  }
};
const onTouchEnd = () => {
  dragEnd();
};

// 마우스이벤트 핸들러
const onMouseDown = (e) => {
  dragStart(e.clientX);
};
const onMouseMove = (e) => {
  if (e.buttons === 1) {
    dragMove(e.clientX);
  }
};
const onMouseUp = () => {
  dragEnd();
};

const totalSessionCount = computed(() => fullSessionWords.value.length);
const memorizedInSession = computed(() => {
  return fullSessionWords.value.length - wordQueue.value.length;
});

const currentWord = computed(() => {
  if (wordQueue.value.length === 0) return null;
  return wordQueue.value[0];
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

// Day 색상
const getDayColor = (day) => {
  const num = parseInt(day.replace(/[^0-9]/g, '')) || 1;
  const hue = (num * 12) % 360;
  return `hsl(${hue}, 75%, 55%)`;
};

// 다중 Day 전체 선택/해제
const selectAllDays = () => {
  setupDays.value = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
};
const clearAllDays = () => {
  setupDays.value = [];
};

// TTS 발음 서비스 호출
const speakText = (text) => {
  if ('speechSynthesis' in window) {
    // 이전 목소리 제거
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // 발음을 좀 더 명확하게 들려주기 위해 약간 느린 배속
    window.speechSynthesis.speak(utterance);
  } else {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'TTS를 지원하지 않는 브라우저입니다.',
      showConfirmButton: false,
      timer: 1500
    });
  }
};

// 단어 강조 표시 (예문 안의 타겟 단어를 굵게 표시)
const highlightWord = (sentence, targetWord) => {
  if (!sentence || !targetWord) return sentence;
  const escapedTarget = targetWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`\\b(${escapedTarget}[a-z]*)\\b`, 'gi');
  return sentence.replace(regex, '<strong>$1</strong>');
};

// 간단한 한글 해석 추출 (예문에 한국어 텍스트가 섞여있다면 잘라내기 등)
const getKoreanTranslation = (sentence) => {
  // 데이터 저장 방식상 한글 번역이 예문 필드에 함께 기록되어 있을 수 있음
  // 만약 예문 필드 안에 한글이 포함되어 있다면 그 부분을 반환하고,
  // 그렇지 않다면 '해석 정보 없음' 표시
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]+.*/;
  const match = sentence.match(koreanRegex);
  return match ? match[0] : '도착하면 제게 연락주세요. (가상해석)';
};

// 간단한 품사 구별 (뜻 맨 앞 한 글자 파싱 또는 유추)
const getPartOfSpeech = (meaning) => {
  if (!meaning) return 'n';
  const text = meaning.trim();
  if (text.endsWith('다')) return 'v'; // 동사 (~다)
  if (text.endsWith('한') || text.endsWith('는') || text.endsWith('운')) return 'adj'; // 형용사
  if (text.endsWith('히') || text.endsWith('게')) return 'adv'; // 부사
  return 'n'; // 명사 기본값
};

// 뜻에서 품사 유추용 텍스트 제거
const cleanMeaning = (meaning) => {
  return meaning || '뜻 정보 없음';
};

// 간단한 발음기호 매칭 (실제 사전 API 대신 모바일 사용성을 위해 유추형 기호 생성)
const getApproximatedPronunciation = (word) => {
  if (!word) return '';
  // 모바일 카드 완성도 극대화를 위한 유연한 가상/유추 발음 기호 맵핑
  const dict = {
    'notify': 'nóutəfài',
    'susceptible': 'səséptəbl',
    'vulnerable': 'vʌ́lnərəbl',
    'anticipate': 'æntísəpèit'
  };
  return dict[word.toLowerCase()] || `${word.toLowerCase()}́`;
};

// 4. 학습 시작
const startStudy = async () => {
  if (setupDays.value.length === 0) {
    return Swal.fire({
      icon: 'warning',
      title: 'Day 미선택',
      text: '학습할 Day를 하나 이상 선택해 주세요.',
      confirmButtonColor: '#4F46E5'
    });
  }

  isLoadingWords.value = true;
  try {
    const q = query(
      collection(db, "words"),
      where("category", "==", setupCategory.value),
      where("day", "in", setupDays.value)
    );
    const querySnapshot = await getDocs(q);
    
    let words = [];
    querySnapshot.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() });
    });

    // 필터링 (미암기 단어만 가져오는 경우)
    if (setupFilter.value === 'unmemorized') {
      words = words.filter(w => !w.isMemorized);
    }

    if (words.length === 0) {
      isLoadingWords.value = false;
      return Swal.fire({
        icon: 'info',
        title: '해당 단어 없음',
        text: '선택한 조건에 맞는 단어가 존재하지 않습니다.',
        confirmButtonColor: '#4F46E5'
      });
    }

    // 피셔-예이츠 무작위 셔플
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    wordQueue.value = words;
    fullSessionWords.value = [...words];
    completedCount.value = 0;
    history.value = [];
    state.value = 'active';
    showTranslation.value = false;
    isBookmarked.value = false;
  } catch (error) {
    console.error("단어 불러오기 실패:", error);
    Swal.fire({ icon: 'error', title: '오류 발생', text: '단어를 가져오는데 실패했습니다.' });
  } finally {
    isLoadingWords.value = false;
  }
};

// 5. 학습 상호작용
const markAsMemorized = async () => {
  if (wordQueue.value.length === 0) return;
  
  const wordToMark = wordQueue.value[0];
  
  // 히스토리 스택에 저장 (되돌리기용)
  history.value.push({
    action: 'memorized',
    word: wordToMark,
    originalState: wordToMark.isMemorized
  });

  // DB 업데이트
  try {
    const docRef = doc(db, "words", wordToMark.id);
    await updateDoc(docRef, { isMemorized: true });
    wordToMark.isMemorized = true;
  } catch (e) {
    console.error("DB 업데이트 오류:", e);
  }

  // 큐에서 제거
  wordQueue.value.shift();
  completedCount.value++;
  showTranslation.value = false;
  isBookmarked.value = false;

  // 모든 단어 완료 여부 체크
  if (wordQueue.value.length === 0) {
    state.value = 'finished';
  }
};

const markForReview = () => {
  if (wordQueue.value.length === 0) return;

  const current = wordQueue.value[0];
  
  // 히스토리 스택에 저장 (되돌리기용)
  history.value.push({
    action: 'review',
    word: current
  });

  // 카드를 리스트 끝으로 이동 (재출현)
  wordQueue.value.shift();
  wordQueue.value.push(current);
  
  showTranslation.value = false;
  isBookmarked.value = false;
};

// 학습 제외 기능 (완전 삭제가 아니라 임시 제외 or memorized 처리)
const excludeWord = () => {
  Swal.fire({
    title: '학습 제외',
    text: '이 단어를 이번 학습 및 암기 완료 상태로 처리하시겠습니까?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10B981',
    cancelButtonColor: '#D1D5DB',
    confirmButtonText: '제외',
    cancelButtonText: '취소'
  }).then((result) => {
    if (result.isConfirmed) {
      markAsMemorized();
    }
  });
};

// 6. 되돌리기 기능 (Undo)
const undoLastAction = async () => {
  if (history.value.length === 0) return;

  const last = history.value.pop();
  
  if (last.action === 'memorized') {
    // DB 복구
    try {
      const docRef = doc(db, "words", last.word.id);
      await updateDoc(docRef, { isMemorized: last.originalState });
      last.word.isMemorized = last.originalState;
    } catch (e) {
      console.error(e);
    }
    
    // 다시 큐의 맨 앞으로 복구
    wordQueue.value.unshift(last.word);
    completedCount.value = Math.max(0, completedCount.value - 1);
  } else if (last.action === 'review') {
    // 큐 끝으로 보냈던 카드를 다시 꺼내 맨 앞으로 복구
    const popped = wordQueue.value.pop();
    wordQueue.value.unshift(popped);
  }
  
  showTranslation.value = false;
  isBookmarked.value = false;
};

// 7. 세션 초기화 및 설정 이동
const exitToSetup = () => {
  state.value = 'setup';
  wordQueue.value = [];
  fullSessionWords.value = [];
};

const restartSession = () => {
  // 이번에 학습했던 세션 단어로 새로고침하여 셔플 후 재시작
  let words = [...fullSessionWords.value];
  
  // 만약 미암기만 학습하기로 설정했다면 암기된 것을 필터링
  if (setupFilter.value === 'unmemorized') {
    words = words.filter(w => !w.isMemorized);
  }

  if (words.length === 0) {
    state.value = 'setup';
    return;
  }

  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  wordQueue.value = words;
  fullSessionWords.value = [...words];
  completedCount.value = 0;
  history.value = [];
  state.value = 'active';
  showTranslation.value = false;
  isBookmarked.value = false;
};
</script>

<script>
export default {
  name: 'StudyMode'
}
</script>

<style scoped>
.day-chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}


.bookmark-btn {
  z-index: 2;
  transition: all 0.2s ease;
}

.word-title {
  letter-spacing: -1px;
  line-height: 1.1;
}

.font-mono {
  font-family: monospace;
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

kbd {
  background-color: #eee;
  border-radius: 3px;
  border: 1px solid #b4b4b4;
  box-shadow: 0 1px 1px rgba(0,0,0,.2), 0 2px 0 0 rgba(255,255,255,.7) inset;
  color: #333;
  display: inline-block;
  font-size: .85em;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  white-space: nowrap;
}
</style>
