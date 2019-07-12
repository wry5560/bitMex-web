<template>
  <a-card title="近期交易" :headStyle="headStyle" :bodyStyle="bodyStyle">
    <div style="height: 400px;">
      <div v-for="(item,index) in tradeTableData" :key="item.trdMatchID" :class="rowClass(item,index)">
        <a-row>
          <a-col :lg="2">
            <div style="text-align: right;">
              <a-icon v-if="item.side=='Buy'" type="caret-up" />
              <a-icon v-if="item.side=='Sell'" type="caret-down" />
            </div>
          </a-col>
          <a-col :lg="4">
            <div style="text-align: right;">{{item.price}}</div>
          </a-col>
          <a-col :lg="6">
            <div style="text-align: right;">{{item.size}}</div>
          </a-col>
          <a-col :lg="9">
            <div style="text-align: center;">{{item.time}}</div>
          </a-col>
          <a-col :lg="3">
            <div style="text-align: center;">{{item.side}}</div>
          </a-col>
        </a-row>
      </div>
    </div>

<!--    <a-table-->
<!--      size="small"-->
<!--      :rowClassName="rowClass"-->
<!--      :showHeader="false"-->
<!--      :dataSource="tradeTableData"-->
<!--      :pagination="false"-->
<!--      :columns="table.columns"-->
<!--    >-->
<!--      <template slot="Price" slot-scope="text,record,index">-->
<!--        <span>-->
<!--          <a-icon v-if="record.side=='Buy'" type="caret-up" />-->
<!--          <a-icon v-if="record.side=='Sell'" type="caret-down" />-->
<!--          <span style="display: inline-block; width:50px; margin-left: 12px">{{text}}</span>-->
<!--        </span>-->
<!--      </template>-->
<!--    </a-table>-->
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
          { title: 'price', dataIndex: 'price', key: 'Price', width: '80px', align: 'right', scopedSlots: { customRender: 'Price' } },
          { title: 'size', dataIndex: 'size', key: 'Qt', width: '80px', align: 'right' },
          { title: 'time', dataIndex: 'time', key: 'Time', width: '80px', align: 'right' },
          { title: 'side', dataIndex: 'side', key: 'Side', width: '20px', align: 'center' }
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
      if (record.side === 'Buy') {
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

</style>
