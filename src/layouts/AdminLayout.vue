<template>
  <div>
    <!-- Sidebar -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      elevation="2"
      color="surface"
    >
      <div class="pa-4 d-flex align-center justify-space-between">
        <h2 class="text-h5 font-weight-bold text-primary">Voca</h2>
      </div>
      
      <v-divider></v-divider>

      <v-list nav>
        <v-list-item
          to="/dashboard"
          prepend-icon="mdi-chart-bar"
          title="Dashboard"
          value="dashboard"
          color="primary"
          rounded="lg"
        ></v-list-item>
        <v-list-item
          to="/words"
          prepend-icon="mdi-book-open-page-variant"
          title="단어 보기"
          value="words"
          color="primary"
          rounded="lg"
        ></v-list-item>
        <v-list-item
          to="/study"
          prepend-icon="mdi-cards-playing-outline"
          title="암기 학습하기"
          value="study"
          color="primary"
          rounded="lg"
        ></v-list-item>
        <v-list-item
          to="/add"
          prepend-icon="mdi-pencil-plus"
          title="단어 등록하기"
          value="add"
          color="primary"
          rounded="lg"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-list-item
            @click="toggleTheme"
            :prepend-icon="theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            :title="theme.global.current.value.dark ? '라이트 모드' : '다크 모드'"
            class="mb-2"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            @click="handleLogout"
            prepend-icon="mdi-logout"
            title="로그아웃"
            base-color="error"
            rounded="lg"
          ></v-list-item>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar for Mobile -->
    <v-app-bar v-if="isMobile" color="surface" elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title class="text-primary font-weight-bold">Voca CMS</v-app-bar-title>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <div class="pa-6 content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme, useDisplay } from 'vuetify';

const router = useRouter();
const theme = useTheme();
const { mobile } = useDisplay();

const isMobile = computed(() => mobile.value);
const drawer = ref(true);

onMounted(() => {
  const savedTheme = localStorage.getItem('voca_theme');
  if (savedTheme) {
    theme.global.name.value = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.global.name.value = 'dark';
  }
});

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
  localStorage.setItem('voca_theme', theme.global.name.value);
};

const handleLogout = () => {
  sessionStorage.removeItem('voca_auth');
  router.push('/login');
};
</script>

<style scoped>
.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
