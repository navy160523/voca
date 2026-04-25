<template>
  <v-container fluid class="fill-height login-bg">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4" lg="3">
        <v-card elevation="10" rounded="xl" class="pa-4 text-center">
          <v-card-item>
            <v-card-title class="text-h4 font-weight-black text-primary mb-2">Voca CMS</v-card-title>
            <v-card-subtitle class="text-subtitle-1">단어장 관리자에 오신 것을 환영합니다</v-card-subtitle>
          </v-card-item>

          <v-card-text class="mt-4">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="password"
                label="관리자 비밀번호"
                type="password"
                variant="outlined"
                color="primary"
                prepend-inner-icon="mdi-lock"
                :error-messages="errorMessage"
                autofocus
                required
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                size="x-large"
                block
                class="mt-4 font-weight-bold"
                elevation="2"
              >
                로그인
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const password = ref('');
const errorMessage = ref('');
const router = useRouter();

const handleLogin = () => {
  const correctPassword = import.meta.env.VITE_APP_PASSWORD || '1234';
  
  if (password.value === correctPassword) {
    sessionStorage.setItem('voca_auth', 'true');
    router.push('/dashboard');
  } else {
    errorMessage.value = '비밀번호가 일치하지 않습니다.';
    password.value = '';
  }
};
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
}
</style>
