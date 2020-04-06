<template>
  <el-row type="flex">
    <el-col>
      <div id="myChart" :style="{width: '600px', height: '500px'}" ref="pieCharts"></div>
    </el-col>
    <el-col>
      <p>{{queryDate | strSub}}</p>
      <el-select v-model="selectedOption" placeholder="请选择" @change="changeOption">
        <el-option
          v-for="item in firstLevelOptions"
          :key="item.id"
          :label="item.first_level"
          :value="item.id"
        ></el-option>
      </el-select>
      <DateTimePicker v-model="queryDate"></DateTimePicker>
    </el-col>
  </el-row>
</template>

<script>
import echarts from "echarts";
import db from "@/utils/sqdb";
import { currentlyMonthDays } from "@/utils/common.js";
import DateTimePicker from "@/components/DateTimePicker";

export default {
  name: "book-analysis",
  components: { DateTimePicker },
  data() {
    return {
      myChart: {},
      chartOption: {
        xAxis: {
          data: []
        },
        yAxis: {},
        series: [
          {
            name: "消费",
            type: "bar",
            data: [],
            label: {
              show: true, // 开启显示
              position: "top", // 在上方显示
              distance: 20, // 距离图形元素的距离。当 position 为字符描述值（如 'top'、'insideRight'）时候有效。
              verticalAlign: "middle",
              textStyle: {
                // 数值样式
                color: "black",
                fontSize: 12
              }
            }
          }
        ]
      },
      // X,Y轴数据
      tmp: [],
      // 时间
      queryDate: [],
      // 一级分类选项
      firstLevelOptions: [],
      selectedOption: 1
    };
  },
  filters: {
    strSub: function(value) {
      return value.map(item => {
        return item.substring(0, 10);
      });
    }
  },
  methods: {
    getFirstLevel() {
      db.all(
        `SELECT id,first_level FROM books_account_category_first where flow_sign = 'consume'`,
        [],
        (err, row) => {
          if (err) {
            throw err;
          }
          this.firstLevelOptions = row;
        }
      );
    },
    getSpecific() {
      let xAxis = [];
      let yAxis = [];
      db.each(
        `SELECT s.id,s.specific_category,sum(b.detailed) as sum FROM (SELECT id,specific_category FROM books_account_category_specific where parent_category_id = ?) as s LEFT JOIN books_account_book as b on s.id = b.types_id WHERE b.when_time > ? AND when_time < ? GROUP by s.id`,
        [this.selectedOption, this.queryDate[0], this.queryDate[1]],
        (err, row) => {
          if (err) {
            throw err;
          }
          xAxis.push(row.specific_category);
          yAxis.push(row.sum.toFixed(2));
        }
      );
      return [xAxis, yAxis];
    },
    changeOption: async function(value) {
      this.selectedOption = value;
      this.tmp = await this.getSpecific();
    }
  },
  created:function(){
    this.getFirstLevel();
  },
  mounted: function() {
    this.currentMotnthDate = currentlyMonthDays();
    this.queryDate = currentlyMonthDays();
    this.myChart = echarts.init(document.getElementById("myChart"));
    this.tmp = this.getSpecific();
    this.myChart.setOption(this.chartOption);
  },
  watch: {
    tmp: function(newValue, oldValue) {
        this.chartOption.xAxis.data = newValue[0]
        this.chartOption.series[0].data = newValue[1]
        this.myChart.setOption(this.chartOption);
    },
    queryDate:function(newVlue,oldValue) {
      this.tmp = this.getSpecific();
    }
  }
};
</script>