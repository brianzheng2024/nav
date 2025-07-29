<template>
  <div id="app">
    <Navigation v-if="isAuthenticated" />
    <router-view />
  </div>
</template>

<script>
import Navigation from './components/Navigation.vue'

export default {
  name: 'App',
  components: {
    Navigation
  },
  computed: {
    isAuthenticated() {
      return this.$route.path !== '/login'
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
}
</style>