<template>
  <div>
    <el-row type="flex">
      <el-col :span="7">
        总资产：{{ totalAssets }}
        <br />
        总负债：{{ totalDebts }}
        <br />
        净资产：{{ netAssets }}
        <br />
        本月支出：{{ currentlyMonthConsume }}
        <br />
        本月收入：{{ currentlyMonthIncome }}
        <br />
        本月总计：{{ currentlyMonthSummed }}
        <br />
        上月支出：{{ previousMonthConsume }}
        <br />
        上月收入：{{ previousMonthIncome }}
        <br />
      </el-col>
      <el-col :span="16">
        <div id="myChart" :style="{ width: '500px', height: '210px' }" ref="pieCharts"></div>
      </el-col>
      <el-col :span="3">
        <DateTimePicker v-model="queryDate"></DateTimePicker>
        <p>{{ showTime }}</p>
      </el-col>
    </el-row>

    <br />
    <!--添加分类-->
    <el-row type="flex">
      <el-form ref="firstCategoryForm" :model="firstCategoryForm" :inline="true" class="demo-form-inline"
        :rules="rules">
        <el-form-item label="一级分类" prop="firstLevel">
          <el-input v-model="firstCategoryForm.firstLevel" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item label="分类类型" prop="flow">
          <el-select v-model="firstCategoryForm.flow" placeholder="请选择" default-first-option>
            <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="submitForm('firstCategoryForm')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row type="flex">
      <!--添加二级分类-->
      <el-form ref="specificCategoryForm" :model="specificCategoryForm" :inline="true" class="demo-form-inline"
        :rules="rules">
        <el-form-item label="二级分类" prop="specificLevel">
          <el-input v-model="specificCategoryForm.specificLevel" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item label="一级分类" prop="superiorLevel">
          <el-select v-model="specificCategoryForm.superiorLevel" placeholder="请选择" default-first-option>
            <el-option v-for="item in superioroptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="submitSpecificForm('specificCategoryForm')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-row>
  </div>
</template>

<script>
import { getFirstLevelConsumeAnalysis_m, totalBalance, addFirstCategory, addSpecificCategory, getselectoptions_m, timeStatistics, getFirstLevelIdAndName_m } from '../tools/dbTools'
import * as echarts from "echarts";
import { currentlyMonthDays, previousMonthDays } from "../tools/tools";
import DateTimePicker from "../components/DateTimePicker.vue";


export default {
  name: "manage",
  components: { DateTimePicker },
  data() {
    return {
      totalAssets: 0,
      totalDebts: 0,
      netAssets: 0,
      currentlyMonthConsume: 0,
      currentlyMonthIncome: 0,
      previousMonthConsume: 0,
      previousMonthIncome: 0,
      currentlyMonthSummed: 0,
      firstCategoryForm: {
        firstLevel: "",
        flow: "",
      },
      specificCategoryForm: {
        specificLevel: "",
        superiorLevel: "",
      },
      selectoptions: [
        {
          value: "consume",
          label: "支出",
        },
        {
          value: "income",
          label: "收入",
        },
      ],
      superioroptions: [],
      rules: {
        firstLevel: [
          { required: true, message: "请输入分类名称", trigger: "blur" },
        ],
        flow: [{ required: true, message: "请选择分类类型", trigger: "blur" }],
        specificLevel: [
          { required: true, message: "请输入分类名称", trigger: "blur" },
        ],
        superiorLevel: [
          { required: true, message: "请输入分类名称", trigger: "blur" },
        ],
      },
      myChart: {},
      queryDate: [],
      chartOption: {
        tooltip: {
          trigger: "item",
          formatter: "{b} : {c} ({d}%)",
        },
        series: [
          {
            name: "当月消费",
            type: "pie",
            radius: "55%",
            data: [],
            label: {
              //饼图图形上的文本标签
              show: true,
              position: "outer", //标签的位置
              fontWeight: 300,
              fontSize: 13, //文字的字体大小
              formatter: "{b} \n {c} ({d}%)",
            },
          },
        ],
      },
      tmp: [],
      firstLevelIdAndName: this.getFirstLevelIdAndName(),
    };
  },
  methods: {
    // 返回一级分类名字和ID组成的对象
    getFirstLevelIdAndName: async function () {
      return await getFirstLevelIdAndName_m()
    },
    // 获取一级分类消费信息
    getFirstLevelConsumeAnalysis: function () {
      getFirstLevelConsumeAnalysis_m(this.queryDate[0], this.queryDate[1]).then(r => { this.tmp = r })
    },
    getAccountInfo() {
      // 获取资产总额
      totalBalance('asset').then(r => { this.totalAssets = r.balance })
      // 获取负债总额
      totalBalance('debt').then(r => { this.totalDebts = 0 - r.balance })
    },
    submitForm(firstCategoryForm) {
      this.$refs[firstCategoryForm].validate((valid) => {
        if (valid) {
          // 提交一级分类
          addFirstCategory(this.firstCategoryForm.firstLevel, this.firstCategoryForm.flow);
          this.getselectoptions();
          this.$notify(this.firstCategoryForm.firstLevel + " 添加成功！");
          this.firstCategoryForm.firstLevel = "";
        } else {
          this.$notify({ type: "error", message: "提交失败" });
        }
      });
    },
    submitSpecificForm(specificCategoryForm) {
      this.$refs[specificCategoryForm].validate((valid) => {
        if (valid) {
          // 提交二级分类
          addSpecificCategory(this.specificCategoryForm.superiorLevel, this.specificCategoryForm.specificLevel);
          this.$notify(this.specificCategoryForm.specificLevel + " 添加成功！");
          this.specificCategoryForm.specificLevel = "";
        } else {
          this.$notify({ type: "error", message: "提交失败" });
        }
      });
    },
    getselectoptions() {
      // 获取一级分类
      getselectoptions_m().then(r => { this.superioroptions = r })
    },
    getCurrentlyMonthStatistics(flow) {
      // 获取本月数据
      let cmd = currentlyMonthDays();
      timeStatistics(flow, cmd[0], cmd[1]).then(row => {
        if (flow === "consume") {
          this.currentlyMonthConsume = row.amount ? row.amount : 0;
        } else if (flow === "income") {
          this.currentlyMonthIncome = row.amount ? row.amount : 0;
        }
      })

    },
    getPreviousMonthStatistics(flow) {
      // 获取上月数据
      let cmd = previousMonthDays();
      timeStatistics(flow, cmd[0], cmd[1]).then(row => {
        if (flow === "consume") {
          this.previousMonthConsume = row.amount ? row.amount : 0;
        } else if (flow === "income") {
          this.previousMonthIncome = row.amount ? row.amount : 0;
        }
      })

    },
  },
  mounted: async function () {
    this.getAccountInfo();
    this.getselectoptions();
    this.getCurrentlyMonthStatistics("income");
    this.getCurrentlyMonthStatistics("consume");
    this.getPreviousMonthStatistics("income");
    this.getPreviousMonthStatistics("consume");
    // 基于准备好的dom，初始化echarts实例
    let that = this;
    this.myChart = echarts.init(document.getElementById("myChart"));
    this.myChart.on("click", async function (params) {
      const firstLevelIdAndName = await that.firstLevelIdAndName
      that.$router.push({
        path: "/bookanalysis",
        query: {
          firstLevel: firstLevelIdAndName[params.name],
          date: that.queryDate,
        },
      });
    });
    this.queryDate = await currentlyMonthDays();
    this.getFirstLevelConsumeAnalysis();
    this.myChart.setOption(this.chartOption);
  },
  computed: {
    showTime: function () {
      return this.queryDate.map((item) => {
        return item.substring(0, 10);
      });
    },
  },
  watch: {
    // 如果账户金额发生改变，则重新计算
    totalAssets: function (newValue, oldValue) {
      this.netAssets = (this.totalAssets - this.totalDebts).toFixed(2);
    },
    totalDebts: function (newValue, oldValue) {
      this.netAssets = (this.totalAssets - this.totalDebts).toFixed(2);
    },
    currentlyMonthConsume: function (newValue, oldValue) {
      this.currentlyMonthSummed = (
        this.currentlyMonthIncome - this.currentlyMonthConsume
      ).toFixed(2);
    },
    currentlyMonthIncome: function (newValue, oldValue) {
      this.currentlyMonthSummed = (
        this.currentlyMonthIncome - this.currentlyMonthConsume
      ).toFixed(2);
    },
    queryDate: async function (newValue, oldValue) {
      await this.getFirstLevelConsumeAnalysis();
    },
    tmp: function (newValue, oldValue) {
      if (newValue.length !== 0) {
        this.chartOption.series[0].data = newValue;
      } else {
        this.chartOption.series[0].data = [{ value: 0, name: "暂无数据" }];
      }
      this.myChart.setOption(this.chartOption);
    },
  },
};
</script>