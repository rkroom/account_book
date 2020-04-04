<template>
  <el-row type="flex">
    <el-col>
      <div id="myChart" :style="{width: '600px', height: '500px'}" ref="pieCharts"></div>
    </el-col>
    <el-col>
      <el-select v-model="selectedOption" placeholder="请选择" @change="changeOption">
        <el-option
          v-for="item in firstLevelOptions"
          :key="item.id"
          :label="item.first_level"
          :value="item.id"
        ></el-option>
      </el-select>
    </el-col>
  </el-row>
</template>

<script>
import echarts from "echarts";
import db from "@/utils/sqdb";

export default {
  name: "book-analysis",
  data() {
    return {
      myChart: {},
      chartOption: {
        title: {
          text: ""
        },
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
      tmp: [],
      cmd: [],
      firstLevelOptions: [],
      selectedOption: 1
    };
  },
  methods: {
    currentlyMonthDays() {
      // 获取当前月份，由此计算本月收支
      let date = new Date();
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      if (month.toString().length === 1) {
        month = "0" + month;
      }
      let d = new Date(year, month, 0);
      return [
        year + "-" + month + "-" + "01 00:00:00",
        year + "-" + month + "-" + d.getDate() + " 23:59:59"
      ];
    },
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
        [this.selectedOption, this.cmd[0], this.cmd[1]],
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
  mounted: function() {
    this.cmd = this.currentlyMonthDays();
    this.myChart = echarts.init(document.getElementById("myChart"));
    this.getFirstLevel();
    this.tmp = this.getSpecific();
  },
  watch: {
    tmp: function(newValue, oldValue) {
      this.chartOption.xAxis.data = newValue[0];
      this.chartOption.series[0].data = newValue[1];
      this.myChart.setOption(this.chartOption);
    }
  }
};
</script>