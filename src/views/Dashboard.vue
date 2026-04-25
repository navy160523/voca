<template>
  <div class="pa-4 animate-fade-in">
    <div class="mb-8">
      <h1 class="text-h4 font-weight-black text-primary mb-2">Dashboard</h1>
      <p class="text-subtitle-1 text-medium-emphasis">학습할 날짜를 선택하세요 (Day 1 ~ Day 30)</p>
    </div>

    <div class="days-grid">
      <v-hover v-slot="{ isHovering, props }" v-for="day in 30" :key="day">
        <v-card
          v-bind="props"
          :elevation="isHovering ? 8 : 2"
          class="day-card text-center py-6"
          rounded="xl"
          @click="goToDay(day)"
          :style="{ '--day-color': getDayColor(day) }"
        >
          <div class="day-number text-h3 font-weight-black" :class="{ 'hovered-text': isHovering }">{{ day }}</div>
          <div class="text-button font-weight-bold mt-2 text-medium-emphasis">Day</div>
        </v-card>
      </v-hover>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const getDayColor = (day) => {
  const hue = (day * 12) % 360;
  return `hsl(${hue}, 75%, 55%)`;
};

const goToDay = (day) => {
  router.push({ path: '/words', query: { day: `Day ${day}` } });
};
</script>

<style scoped>
.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1.5rem;
}

.day-card {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.day-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background-color: var(--day-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
  transform-origin: left;
}

.day-card:hover {
  transform: translateY(-5px);
}

.day-card:hover::before {
  transform: scaleX(1);
}

.hovered-text {
  color: var(--day-color) !important;
}

.day-number {
  transition: color 0.3s ease;
}

@media (min-width: 640px) {
  .days-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1024px) {
  .days-grid {
    grid-template-columns: repeat(10, 1fr);
  }
}
</style>
