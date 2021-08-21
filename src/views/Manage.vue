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
        <div
          id="myChart"
          :style="{ width: '500px', height: '210px' }"
          ref="pieCharts"
        ></div>
      </el-col>
      <el-col :span="3">
        <DateTimePicker v-model="queryDate"></DateTimePicker>
        <p>{{ showTime }}</p>
      </el-col>
    </el-row>

    <br />
    <!--添加分类-->
    <el-row type="flex">
      <el-form
        ref="firstCategoryForm"
        :model="firstCategoryForm"
        :inline="true"
        class="demo-form-inline"
        :rules="rules"
      >
        <el-form-item label="一级分类" prop="firstLevel">
          <el-input
            v-model="firstCategoryForm.firstLevel"
            placeholder="请输入分类名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="分类类型" prop="flow">
          <el-select
            v-model="firstCategoryForm.flow"
            placeholder="请选择"
            default-first-option
          >
            <el-option
              v-for="item in selectoptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="submitForm('firstCategoryForm')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-row>
    <el-row type="flex">
      <!--添加二级分类-->
      <el-form
        ref="specificCategoryForm"
        :model="specificCategoryForm"
        :inline="true"
        class="demo-form-inline"
        :rules="rules"
      >
        <el-form-item label="二级分类" prop="specificLevel">
          <el-input
            v-model="specificCategoryForm.specificLevel"
            placeholder="请输入分类名称"
          ></el-input>
        </el-form-item>
        <el-form-item label="一级分类" prop="superiorLevel">
          <el-select
            v-model="specificCategoryForm.superiorLevel"
            placeholder="请选择"
            default-first-option
          >
            <el-option
              v-for="item in superioroptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="submitSpecificForm('specificCategoryForm')"
            >提交</el-button
          >
        </el-form-item>
      </el-form>
    </el-row>
  </div>
</template>

<script>
import db from "@/utils/sqdb";
import * as echarts from "echarts";
import { currentlyMonthDays, previousMonthDays } from "@/utils/common";
import DateTimePicker from "@/components/DateTimePicker";

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
              textStyle: {
                fontWeight: 300,
                fontSize: 13, //文字的字体大小
              },
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
    getFirstLevelIdAndName() {
      let tmp = {};
      db.each(
        `SELECT id,first_level FROM books_account_category_first`,
        [],
        (err, row) => {
          tmp[row.first_level] = row.id;
        }
      );
      return tmp;
    },
    // 获取一级分类消费信息
    getFirstLevelConsumeAnalysis: async function () {
      this.tmp = await db.asyncAll(
        `SELECT round(sum(b.detailed),2) as value,f.first_level as name FROM books_account_book as b left JOIN 
      books_account_category_specific as s on b.types_id = s.id LEFT JOIN books_account_category_first as f on s.parent_category_id = f.id 
      WHERE flow="consume" AND when_time >= ? AND when_time <= ? GROUP BY parent_category_id`,
        [this.queryDate[0], this.queryDate[1]]
      );
    },
    getAccountInfo() {
      // 获取资产总额
      db.get(
        `SELECT round(sum(amount),2) as amount FROM books_account_info WHERE type = 'asset'`,
        [],
        (err, row) => {
          if (err) {
            throw err;
          }
          this.totalAssets = row.amount;
        }
      );
      // 获取负债总额
      db.get(
        `SELECT round(sum(amount),2) as amount FROM books_account_info WHERE type = 'debt'`,
        [],
        (err, row) => {
          if (err) {
            throw err;
          }
          this.totalDebts = row.amount;
        }
      );
    },
    submitForm(firstCategoryForm) {
      this.$refs[firstCategoryForm].validate((valid) => {
        if (valid) {
          // 提交一级分类
          db.run(
            `INSERT INTO books_account_category_first(first_level,flow_sign) values (?,?)`,
            [this.firstCategoryForm.firstLevel, this.firstCategoryForm.flow]
          );
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
          db.run(
            `INSERT INTO books_account_category_specific(parent_category_id,specific_category) values (?,?)`,
            [
              this.specificCategoryForm.superiorLevel,
              this.specificCategoryForm.specificLevel,
            ]
          );
          this.$notify(this.specificCategoryForm.specificLevel + " 添加成功！");
          this.specificCategoryForm.specificLevel = "";
        } else {
          this.$notify({ type: "error", message: "提交失败" });
        }
      });
    },
    getselectoptions() {
      // 获取一级分类
      let selectoptions = [];
      const flowlist = { consume: "支出", income: "收入" };
      db.each(`select * from books_account_category_first`, [], (err, row) => {
        let option = { value: 1, label: "default" };
        if (err) {
          throw err;
        }
        option.value = row.id;
        option.label = row.first_level + "（" + flowlist[row.flow_sign] + "）";
        selectoptions.push(option);
      });
      this.superioroptions = selectoptions;
    },
    getCurrentlyMonthStatistics(flow) {
      // 获取本月数据
      let cmd = currentlyMonthDays();
      db.get(
        `SELECT round(sum(detailed),2) as amount FROM books_account_book WHERE flow = ? AND when_time > ? AND when_time < ?`,
        [flow, cmd[0], cmd[1]],
        (err, row) => {
          if (err) {
            throw err;
          }
          if (flow === "consume") {
            this.currentlyMonthConsume = row.amount ? row.amount : 0;
          } else if (flow === "income") {
            this.currentlyMonthIncome = row.amount ? row.amount : 0;
          }
        }
      );
    },
    getPreviousMonthStatistics(flow) {
      // 获取上月数据
      let cmd = previousMonthDays();
      db.get(
        `SELECT round(sum(detailed),2) as amount FROM books_account_book WHERE flow = ? AND when_time > ? AND when_time < ?`,
        [flow, cmd[0], cmd[1]],
        (err, row) => {
          if (err) {
            throw err;
          }
          if (flow === "consume") {
            this.previousMonthConsume = row.amount ? row.amount : 0;
          } else if (flow === "income") {
            this.previousMonthIncome = row.amount ? row.amount : 0;
          }
        }
      );
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
    this.myChart.on("click", function (params) {
      that.$router.push({
        path: "/bookanalysis",
        query: {
          firstLevel: that.firstLevelIdAndName[params.name],
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
