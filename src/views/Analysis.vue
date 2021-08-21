<template>
  <el-row type="flex">
    <div ref="divbookPopover">
      <el-popover
        placement="bottom"
        trigger="manual"
        @after-enter="show"
        v-model:visible="popoverVisible"
      >
        <template #reference><span></span></template>
        <BookTable
          :category="bookTableCategory"
          :time="queryDate"
          :cellStyle="cellStyle"
          :style="{ width: '750px' }"
        ></BookTable>
      </el-popover>
    </div>
    <el-col>
      <div
        id="myChart"
        :style="{ width: '600px', height: '500px' }"
        ref="pieCharts"
      ></div>
    </el-col>
    <el-col>
      <p>{{ queryDate }}</p>
      <el-select
        v-model="selectedOption"
        placeholder="请选择"
        @change="changeOption"
      >
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
import * as echarts from "echarts";
import db from "@/utils/sqdb";
import { currentlyMonthDays } from "@/utils/common";
import DateTimePicker from "@/components/DateTimePicker";
import BookTable from "@/components/BookTable";

export default {
  name: "book-analysis",
  components: { DateTimePicker, BookTable },
  data() {
    return {
      myChart: {},
      chartOption: {
        xAxis: {
          data: [],
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
                fontSize: 12,
              },
            },
          },
        ],
      },
      // X,Y轴数据
      tmp: [],
      // 时间
      queryDate: this.$route.query.date
        ? this.$route.query.date
        : currentlyMonthDays(),
      // 一级分类选项
      firstLevelOptions: [],
      selectedOption: this.$route.query.firstLevel
        ? this.$route.query.firstLevel
        : 1,
      SpecificIdandName: [],
      bookTableCategory: "",
      popoverVisible: false,
      cellStyle: { padding: 0, background: "#F0FFFF" },
    };
  },
  methods: {
    // 当弹出窗显示完毕后添加监听鼠标点击事件
    show: function () {
      document.addEventListener("click", this.hidePanel, false);
    },
    // 当关闭弹出窗后移除监听鼠标点击事件
    hide: function () {
      document.removeEventListener("click", this.hidePanel, false);
    },
    hidePanel: function (e) {
      // 如果鼠标点击在弹出窗区域外则关闭弹出窗
      if (!this.$refs.divbookPopover.contains(e.target)) {
        this.popoverVisible = false;
        this.hide();
      }
    },
    // 获取一级分类
    async getFirstLevel() {
      this.firstLevelOptions = await db.asyncAll(
        `SELECT id,first_level FROM books_account_category_first`,
        []
      );
    },
    // 获取二级分类数据
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
    getSpecificIdandName: async function () {
      let rows = await db.asyncAll(
        `SELECT id,specific_category FROM books_account_category_specific`,
        []
      );
      let tmp = {};
      rows.forEach((row) => {
        tmp[row.specific_category] = row.id;
      });
      return tmp;
    },
    // 数据修改
    changeOption: async function (value) {
      this.selectedOption = value;
      this.tmp = await this.getSpecific();
    },
  },
  created: function () {
    this.getSpecificIdandName().then((value) => {
      this.SpecificIdandName = value;
    });
    this.getFirstLevel();
  },
  mounted: function () {
    this.currentMotnthDate = currentlyMonthDays();
    this.myChart = echarts.init(document.getElementById("myChart"));
    let that = this;
    this.myChart.on("click", function (params) {
      that.bookTableCategory = that.SpecificIdandName[params.name];
      that.popoverVisible = true;
    });
    this.tmp = this.getSpecific();
    setTimeout(() => {
      this.myChart.setOption(this.chartOption);
    }, 500);
  },
  watch: {
    tmp: function (newValue, oldValue) {
      this.chartOption.xAxis.data = newValue[0];
      this.chartOption.series[0].data = newValue[1];
      setTimeout(() => {
        this.myChart.setOption(this.chartOption);
      }, 500);
    },
    queryDate: function (newVlue, oldValue) {
      this.tmp = this.getSpecific();
    },
  },
};
</script>
