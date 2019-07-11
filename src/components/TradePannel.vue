<template>
  <a-card title="近期交易" :headStyle="headStyle" :bodyStyle="bodyStyle">
    <a-table
      size="small"
      :rowClassName="rowClass"
      :showHeader="false"
      :dataSource="tradeTableData"
      :pagination="false"
      :columns="table.columns"
    >
      <template slot="Price" slot-scope="text,record,index">
        <span>
          <a-icon v-if="record.Side=='B'" type="caret-up" />
          <a-icon v-if="record.Side=='S'" type="caret-down" />
          <span style="display: inline-block; margin-left: 12px">{{text}}</span>
        </span>
      </template>
    </a-table>
  </a-card>
</template>

<script>
export default {
  name: 'TradePannel',
  props: {
    tradeTableData: Array
  },
  data () {
    return {
      bodyStyle: {
        height: '400px',
        padding: 0,
        overflow: 'auto'
      },
      headStyle: {
        'text-align': 'left'
      },
      table: {
        columns: [
          { title: 'Price', dataIndex: 'Price', key: 'Price', width: '80px', align: 'right', scopedSlots: { customRender: 'Price' } },
          { title: 'Qt', dataIndex: 'Qt', key: 'Qt', width: '80px', align: 'right' },
          { title: 'Time', dataIndex: 'Time', key: 'Time', width: '80px', align: 'right' },
          { title: 'Side', dataIndex: 'Side', key: 'Side', width: '20px', align: 'center' }
        ]
      }
    }
  },
  methods: {
    // ----------------------------------------------------表格通用方法--------------------------

    // 单双行条纹样式
    rowClass (record, index) {
      let classNames = ''
      if (index % 2 === 1) classNames = 'even-rows '
      if (record.Side === 'B') {
        classNames = classNames + ' ' + 'buy-trade'
      } else {
        classNames = classNames + ' ' + 'sell-trade'
      }
      return classNames
    }
  }
}
</script>

<style>
  .buy-trade{
    color: #af0e00;
  }
  .sell-trade{
    color: #006a00;
  }
</style>
