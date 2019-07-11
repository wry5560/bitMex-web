<template>
    <div>
      <a-card title="用户面板" :headStyle="headStyle" :bodyStyle="bodyStyle">
        <div>111</div>
      </a-card>
    </div>
</template>

<script>
export default {
  name: 'userPannel',

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
