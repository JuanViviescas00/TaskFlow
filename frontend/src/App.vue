<script setup>
// Componente raíz App.vue (doc §3.8, HU-12): Delega el marco visual a MainLayout
import MainLayout from './layouts/MainLayout.vue'
</script>

<template>
  <MainLayout>
    <RouterView />
  </MainLayout>
</template>
