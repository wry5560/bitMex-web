<template>
  <a-card title="委托列表" :headStyle="headStyle" :bodyStyle="bodyStyle">
    <div>111</div>
  </a-card>
</template>

<script>
export default {
  name: 'OrderBookPannel',

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
