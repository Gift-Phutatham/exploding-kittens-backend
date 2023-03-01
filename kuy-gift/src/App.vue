
<template>
  <div>
  <!-- <ilisten></ilisten> -->
  <p1>KUY</p1>
</div>
</template>

<script>
import SocketioService from './services/socketio.service.js';

export default {
  name: 'App',
  components: {
  },
  created(){
    SocketioService.setupSocketConnection();
  },
}
</script>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
