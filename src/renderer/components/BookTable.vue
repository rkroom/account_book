<template>
  <div>
    <!--表格组件-->
    <el-table :data="tableData" :cell-style="cellStyle">
      <el-table-column prop="date" width="139">
        <template slot="header">
          日期
          <DateTimePicker v-model="selectedTime" :icon="true"></DateTimePicker>
        </template>
      </el-table-column>
      <el-table-column prop="category">
        <template slot="header">
          分类
          <el-popover ref="categoryPopover" placement="right" trigger="click">
            <i class="el-icon-arrow-down" slot="reference"></i>
            <el-cascader
              ref="categoriesCascader"
              :options="categoriesOptions"
              :props="defaultParams"
              v-model="categoryId"
              :show-all-levels="false"
            ></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanCategory">清空</button>
              <button @click="handleCategoryChange" slot="reference">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="flow">
        <template slot="header">
          收支
          <el-popover ref="flowPopover" placement="right" trigger="click">
            <i class="el-icon-arrow-down" slot="reference"></i>
            <el-cascader
              ref="flowCascader"
              :options="flowOptions"
              :props="defaultParams"
              v-model="selectFlow"
              :show-all-levels="false"
            ></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanFlow">清空</button>
              <button @click="handleFlowChange" slot="reference">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="detailed" label="金额"></el-table-column>
      <el-table-column prop="account" width="100">
        <template slot="header">
          账户
          <el-popover ref="accountPopover" placement="right" trigger="click">
            <i class="el-icon-arrow-down" slot="reference"></i>
            <el-cascader
              ref="accountCascader"
              :options="accountOptions"
              :props="defaultParams"
              v-model="selectAccount"
              :show-all-levels="false"
            ></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanAccount">清空</button>
              <button @click="handleAccountChange" slot="reference">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="aim_account" width="100">
        <template slot="header">目标账户</template>
      </el-table-column>
      <el-table-column prop="comment" label="备注" :show-overflow-tooltip="true" width="100"></el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="handleDelete(scope.$index,scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      layout="prev, pager, next"
      :total="totalPage"
      :page-size="pageSize"
      @current-change="handlePage"
    ></el-pagination>
  </div>
</template>
<script>
import db from "@/utils/sqdb";
import vm from "@/components/event.js"; // 借助第三方进行通信
import DateTimePicker from "@/components/DateTimePicker";

export default {
  name: "BookTable",
  components: { DateTimePicker },
  data() {
    return {
      defaultParams: {
        expandTrigger: "hover",
        label: "name",
        value: "id",
        children: "children"
      },
      tableData: [],
      totalPage: 0,
      accountName: {},
      accountType: {},
      categoryName: {},
      pageSize: 13,
      selectedTime: this.time,
      categoriesOptions: this.getselect(),
      categoryNull: "null or",
      categoryId: this.category,
      categoryParam: this.category,
      flowOptions: [
        { id: "income", name: "收入" },
        { id: "consume", name: "支出" },
        { id: "transfer", name: "转账" }
      ],
      selectFlow: this.flow,
      flowParam: this.flow,
      accountOptions: this.getAccountOptions(),
      selectAccount: this.account,
      accountParam: this.account
    };
  },
  //父组件传递过来的账户ID
  props: {
    account: {
      type: [String, Number],
      default: "%"
    },
    cellStyle: {
      type: Object,
      default: () => ({})
    },
    time: {
      type: Array,
      default: () => {
        return ["0000-00-00", "now"];
      }
    },
    category: {
      type: [String, Number],
      default: "%"
    },
    flow: {
      type: String,
      default: "%"
    }
  },
  methods: {
    // 接收从记账组件传递过来的数据
    receive: function() {
      let flowlist = { consume: "支出", income: "收入", transfer: "转账" };
      vm.$on("appendTable", row => {
        this.tableData.unshift({
          id: row.id,
          date: row.when_time.substring(0, 16),
          category: this.categoryName[row.types_id],
          flow: flowlist[row.flow],
          detailed: row.detailed,
          account: this.accountName[row.account_info_id],
          aim_account: this.accountName[row.aim_account_id],
          comment: row.comment,
          flowSign: row.flow,
          account_id: row.account_info_id,
          aim_account_id: row.aim_account_id
        });
      });
    },
    // 获取账户名
    getAccountName: function() {
      let accountNames = {};
      db.each(`select * from books_account_info`, [], (err, row) => {
        if (err) {
          throw err;
        }
        accountNames[row.id] = row.name;
      });
      return accountNames;
    },
    handleDelete(index, row) {
      // 删除记账记录
      this.$confirm(
        "此操作将删除金额为 " + row.detailed + " 的记录, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
        .then(() => {
          db.serialize(() => {
            db.run(`BEGIN TRANSACTION`);
            if (row.flowSign === "consume") {
              if (this.accountType[row.account_id] === "asset") {
                db.run(
                  `UPDATE books_account_info set amount = amount + ? where id = ?`,
                  [row.detailed, row.account_id]
                );
              } else if (this.accountType[row.account_id] === "debt") {
                db.run(
                  `UPDATE books_account_info set amount = amount - ? where id = ?`,
                  [row.detailed, row.account_id]
                );
              }
            } else if (row.flowSign === "income") {
              if (this.accountType[row.account_id] === "asset") {
                db.run(
                  `UPDATE books_account_info set amount = amount - ? where id = ?`,
                  [row.detailed, row.account_id]
                );
              } else if (this.accountType[row.account_id] === "debt") {
                db.run(
                  `UPDATE books_account_info set amount = amount + ? where id = ?`,
                  [row.detailed, row.account_id]
                );
              }
            } else if (row.flowSign === "transfer") {
              if (
                this.accountType[row.account_id] ===
                this.accountType[row.aim_account_id]
              ) {
                db.run(
                  `UPDATE books_account_info set amount = amount + ? where id = ?`,
                  [row.detailed, row.account_id]
                );
                db.run(
                  `UPDATE books_account_info set amount = amount - ? where id = ?`,
                  [row.detailed, row.aim_account_id]
                );
              } else if (this.accountType[row.account_id] === "asset") {
                db.run(
                  `UPDATE books_account_info set amount = amount + ? where id = ?`,
                  [row.detailed, row.account_id]
                );
                db.run(
                  `UPDATE books_account_info set amount = amount + ? where id = ?`,
                  [row.detailed, row.aim_account_id]
                );
              } else if (this.accountType[row.account_id] === "debt") {
                db.run(
                  `UPDATE books_account_info set amount = amount - ? where id = ?`,
                  [row.detailed, row.account_id]
                );
                db.run(
                  `UPDATE books_account_info set amount = amount - ? where id = ?`,
                  [row.detailed, row.aim_account_id]
                );
              }
            }
            db.run(`DELETE  From books_account_book where id = ?`, [row.id]);
            db.run(`COMMIT`);
          });
          this.tableData.splice(index, 1);
          this.$message({
            type: "success",
            message: "删除成功!"
          });
        })
        .catch(() => {
          this.$notify({
            type: "info",
            message: "已取消删除"
          });
        });
    },
    // 更改页码
    handlePage(value) {
      this.gettabledata(this.pageSize, (value - 1) * this.pageSize);
    },
    // 获取总页数
    gettotalpage() {
      db.get(
        `SELECT COUNT(*) as count from ( SELECT * FROM books_account_book WHERE types_id is ` +
          this.categoryNull +
          ` types_id like ? )  WHERE account_info_id like ? and when_time >= ? and when_time <= ? and flow like ? `,
        [
          this.categoryParam[this.categoryParam.length - 1],
          this.accountParam,
          this.selectedTime[0],
          this.selectedTime[1],
          this.flowParam[0]
        ],
        (err, row) => {
          if (err) {
            throw err;
          }
          this.totalPage = row.count;
        }
      );
    },
    // 获取数据
    gettabledata(pageSize, page) {
      let tabledata = [];
      let flowlist = { consume: "支出", income: "收入", transfer: "转账" };
      db.each(
        `select * from ( SELECT * FROM books_account_book WHERE types_id is ` +
          this.categoryNull +
          ` types_id like ? )  where account_info_id like ? and when_time >= ? and when_time <= ? and flow like ? order by when_time desc limit ? offset ?`,
        [
          this.categoryParam[this.categoryParam.length - 1],
          this.accountParam,
          this.selectedTime[0],
          this.selectedTime[1],
          this.flowParam[0],
          this.pageSize,
          page
        ],
        (err, row) => {
          let data = {
            id: 1,
            date: "2000-00-00",
            category: "早午晚餐",
            flow: "支出",
            detailed: "0",
            account: "余额宝",
            aim_account: "现金",
            comment: "",
            flowSign: ""
          };
          if (err) {
            throw err;
          }
          data.id = row.id;
          data.date = row.when_time.substring(0, 16);
          data.category = this.categoryName[row.types_id];
          data.flow = flowlist[row.flow];
          data.detailed = row.detailed;
          data.account = this.accountName[row.account_info_id];
          data.aim_account = this.accountName[row.aim_account_id];
          data.comment = row.comment;
          data.flowSign = row.flow;
          data.aim_account_id = row.aim_account_id;
          data.account_id = row.account_info_id;
          tabledata.push(data);
        }
      );
      this.tableData = tabledata;
    },
    //当分类弹窗确定点击时
    handleCategoryChange: function() {
      if (this.categoryId.length) {
        this.categoryNull = "not null and";
        this.categoryParam = this.categoryId;
      } else {
        this.categoryNull = "null or";
        this.categoryParam = "%";
      }
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.$refs.categoryPopover.doClose();
    },
    //当分类弹窗清除点击时
    cleanCategory: function() {
      this.categoryNull = "null or";
      this.$refs["categoriesCascader"].handleClear();
      this.categoryId = this.category;
      this.categoryParam = this.category;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.$refs.categoryPopover.doClose();
    },
    cleanFlow: function() {
      this.selectFlow = "%";
      this.flowParam = "%";
      this.$refs.flowCascader.handleClear();
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.$refs.flowPopover.doClose();
    },
    handleFlowChange: function() {
      this.flowParam = this.selectFlow;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.$refs.flowPopover.doClose();
    },
    cleanAccount: function() {
      this.selectAccount = "%";
      this.accountParam = "%";
      this.$refs.accountCascader.handleClear();
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.$refs.accountPopover.doClose();
    },
    handleAccountChange: function() {
      this.accountParam = this.selectAccount[0];
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.$refs.accountPopover.doClose();
    },
    // 获取账户类型
    getAccountType() {
      let accountTypes = {};
      db.each(`select * from books_account_info`, [], (err, row) => {
        if (err) {
          throw err;
        }
        accountTypes[row.id] = row.type;
      });
      this.accountType = accountTypes;
    },
    // 获取分类名
    getCategoryName() {
      let categoryName = {};
      db.each(
        `SELECT id,specific_category from books_account_category_specific`,
        [],
        (err, row) => {
          if (err) {
            throw err;
          }
          categoryName[row.id] = row.specific_category;
        }
      );
      this.categoryName = categoryName;
    },
    // 初始化数据
    async getdata() {
      this.accountName = await this.getAccountName();
      await this.getCategoryName();
      await this.getAccountType();
      await this.gettabledata(this.pageSize, 0);
      await this.gettotalpage();
    },
    getselect: function() {
      let options = [];
      db.each(`select * from books_account_category_first`, [], (err, row) => {
        if (err) {
          throw err;
        }
        let firstcategory = { id: 1, name: "default", children: [] };
        let specific = [];
        function getspecifik(row) {
          db.each(
            `select * from books_account_category_specific where parent_category_id = ?`,
            [row.id],
            (err, row) => {
              if (err) {
                throw err;
              }
              let specificcategory = { id: 1, name: "default" };
              specificcategory.id = row.id;
              specificcategory.name = row.specific_category;
              specific.push(specificcategory);
            }
          );
        }
        getspecifik(row);
        firstcategory.id = row.id;
        firstcategory.name = row.first_level;
        firstcategory.children = specific;
        options.push(firstcategory);
      });
      return options;
    },
    //获取账户
    getAccountOptions: function() {
      let selectoptions = [];
      db.each(`select * from books_account_info`, [], (err, row) => {
        let option = { value: 1, label: "default" };
        if (err) {
          throw err;
        }
        option.id = row.id;
        option.name = row.name;
        selectoptions.push(option);
      });
      return selectoptions;
    }
  },
  created: function() {
    this.getdata();
  },
  mounted: function() {
    this.receive();
  },
  watch: {
    // 当父组件传递过来的账户ID发生改变
    account: function() {
      this.accountParam = this.account;
      this.gettabledata(this.pageSize, 0);
      this.gettotalpage();
    },
    selectedTime: function() {
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
    },
    time: function() {
      this.selectedTime = this.time;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
    },
    category: function() {
      this.categoryNull = "not null and";
      let tmp = []
      tmp.push(this.category)
      this.categoryParam = tmp;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
    }
  }
};
</script>
