<template>
  <a-card title="操作" :headStyle="headStyle" :bodyStyle="bodyStyle">
    <div>111</div>
  </a-card>
</template>

<script>
export default {
  name: 'CelvePannel',

  data () {
    return {
      bodyStyle: {
        height: '400px',
        padding: 0
      },
      headStyle: {
        'text-align': 'left'
      }
    }
  }
}
</script>

<style scoped>

</style>
