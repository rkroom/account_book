<template>
  <div>
    <el-row type="flex">
      <el-col :span="7">
        总资产：{{ totalAssets | reservedecimal }}
        <br />
        总负债：{{ totalDebts | reservedecimal }}
        <br />
        净资产：{{ netAssets | reservedecimal }}
        <br />
        本月支出：{{ currentlyMonthConsume | reservedecimal }}
        <br />
        本月收入：{{ currentlyMonthIncome | reservedecimal }}
        <br />
        本月总计：{{ currentlyMonthSummed | reservedecimal }}
        <br />
        上月支出：{{ previousMonthConsume | reservedecimal }}
        <br />
        上月收入：{{ previousMonthIncome | reservedecimal }}
        <br />
      </el-col>
      <el-col :span="16">
        <div id="myChart" :style="{width: '500px', height: '210px'}" ref="pieCharts"></div>
      </el-col>
      <el-col :span="3">
        <DateTimePicker v-model="queryDate"></DateTimePicker>
        <p>{{queryDate | strSub}}</p>
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
          <el-input v-model="firstCategoryForm.firstLevel" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item label="分类类型" prop="flow">
          <el-select v-model="firstCategoryForm.flow" placeholder="请选择" default-first-option>
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
          <el-input v-model="specificCategoryForm.specificLevel" placeholder="请输入分类名称"></el-input>
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
          <el-button @click="submitSpecificForm('specificCategoryForm')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-row>
  </div>
</template>

<script>
import db from "@/utils/sqdb";
import echarts from "echarts";
import { currentlyMonthDays, previousMonthDays } from "@/utils/common.js";
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
        flow: ""
      },
      specificCategoryForm: {
        specificLevel: "",
        superiorLevel: ""
      },
      selectoptions: [
        {
          value: "consume",
          label: "支出"
        },
        {
          value: "income",
          label: "收入"
        }
      ],
      superioroptions: [],
      rules: {
        firstLevel: [
          { required: true, message: "请输入分类名称", trigger: "blur" }
        ],
        flow: [{ required: true, message: "请选择分类类型", trigger: "blur" }],
        specificLevel: [
          { required: true, message: "请输入分类名称", trigger: "blur" }
        ],
        superiorLevel: [
          { required: true, message: "请输入分类名称", trigger: "blur" }
        ]
      },
      myChart: {},
      queryDate: [],
      chartOption: {
        tooltip: {
          trigger: "item",
          formatter: "{b} : {c} ({d}%)"
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
                fontSize: 13 //文字的字体大小
              },
              formatter: "{b} \n {c} ({d}%)"
            }
          }
        ]
      },
      tmp: []
    };
  },
  filters: {
    // 将数字保留两位小数
    reservedecimal: function(value) {
      return value.toFixed(2);
    },
    strSub: function(value) {
      return value.map(item => {
        return item.substring(0, 10);
      });
    }
  },
  methods: {
    // 获取一级分类消费信息
    getFirstLevelConsumeAnalysis: function() {
      let tmp = [];
      db.each(
        `SELECT GROUP_CONCAT(s.id) as sid,f.first_level FROM books_account_category_specific as s,(SELECT id,first_level FROM books_account_category_first where flow_sign = 'consume') as f WHERE s.parent_category_id = f.id GROUP by first_level`,
        [],
        (err, row) => {
          if (err) {
            throw err;
          }
          db.get(
            `SELECT sum(detailed) as SUM FROM books_account_book WHERE types_id in (` +
              row.sid +
              `) AND when_time > ? AND when_time < ?`,
            [this.queryDate[0], this.queryDate[1]],
            (err, sumResult) => {
              if (err) {
                throw err;
              }
              if (sumResult.SUM) {
                tmp.push({
                  value: sumResult.SUM.toFixed(2),
                  name: row.first_level
                });
              }
            }
          );
        }
      );
      this.tmp = tmp;
    },
    getAccountInfo() {
      // 获取资产总额
      db.get(
        `SELECT sum(amount) as amount FROM books_account_info WHERE type = 'asset'`,
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
        `SELECT sum(amount) as amount FROM books_account_info WHERE type = 'debt'`,
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
      this.$refs[firstCategoryForm].validate(valid => {
        if (valid) {
          // 提交一级分类
          db.run(
            `INSERT INTO books_account_category_first(first_level,flow_sign) values (?,?)`,
            [this.firstCategoryForm.firstLevel, this.firstCategoryForm.flow]
          );
          this.getselectoptions();
          this.$message(this.firstCategoryForm.firstLevel + " 添加成功！");
          this.firstCategoryForm.firstLevel = "";
        } else {
          this.$message({ type: "error", message: "提交失败" });
        }
      });
    },
    submitSpecificForm(specificCategoryForm) {
      this.$refs[specificCategoryForm].validate(valid => {
        if (valid) {
          // 提交二级分类
          db.run(
            `INSERT INTO books_account_category_specific(parent_category_id,specific_category) values (?,?)`,
            [
              this.specificCategoryForm.superiorLevel,
              this.specificCategoryForm.specificLevel
            ]
          );
          this.$message(
            this.specificCategoryForm.specificLevel + " 添加成功！"
          );
          this.specificCategoryForm.specificLevel = "";
        } else {
          this.$message({ type: "error", message: "提交失败" });
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
        `SELECT sum(detailed) as amount FROM books_account_book WHERE flow = ? AND when_time > ? AND when_time < ?`,
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
        `SELECT sum(detailed) as amount FROM books_account_book WHERE flow = ? AND when_time > ? AND when_time < ?`,
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
    }
  },
  mounted: async function() {
    this.getAccountInfo();
    this.getselectoptions();
    this.getCurrentlyMonthStatistics("income");
    this.getCurrentlyMonthStatistics("consume");
    this.getPreviousMonthStatistics("income");
    this.getPreviousMonthStatistics("consume");
    // 基于准备好的dom，初始化echarts实例
    this.myChart = echarts.init(document.getElementById("myChart"));
    this.queryDate = await currentlyMonthDays();
    this.getFirstLevelConsumeAnalysis();
    this.myChart.setOption(this.chartOption);
  },
  watch: {
    // 如果账户金额发生改变，则重新计算
    totalAssets: function(newValue, oldValue) {
      this.netAssets = this.totalAssets - this.totalDebts;
    },
    totalDebts: function(newValue, oldValue) {
      this.netAssets = this.totalAssets - this.totalDebts;
    },
    currentlyMonthConsume: function(newValue, oldValue) {
      this.currentlyMonthSummed =
        this.currentlyMonthIncome - this.currentlyMonthConsume;
    },
    currentlyMonthIncome: function(newValue, oldValue) {
      this.currentlyMonthSummed =
        this.currentlyMonthIncome - this.currentlyMonthConsume;
    },
    queryDate: async function(newValue, oldValue) {
      await this.getFirstLevelConsumeAnalysis();
    },
    tmp: function(newValue, oldValue) {
      if (newValue.length !== 0) {
        this.chartOption.series[0].data = newValue;
      } else {
        this.chartOption.series[0].data = [{ value: 0, name: "暂无数据" }];
      }
      this.myChart.setOption(this.chartOption);
    }
  }
};
</script>
