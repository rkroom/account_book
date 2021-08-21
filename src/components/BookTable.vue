<template>
  <div>
    <!--表格组件-->
    <el-table :data="tableData" :cell-style="cellStyle">
      <el-table-column prop="date" width="139">
        <template #header>
          日期
          <DateTimePicker v-model="selectedTime"></DateTimePicker>
        </template>
      </el-table-column>
      <el-table-column prop="category">
        <template #header>
          分类
          <el-popover
            ref="categoryPopover"
            placement="right"
            trigger="manual"
            v-model:visible="categoryVisible"
          >
            <template #reference>
              <el-button
                type="text"
                icon="el-icon-arrow-down"
                @click="categoryVisible = !categoryVisible"
              ></el-button>
            </template>
            <el-cascader
              ref="categoriesCascader"
              :options="categoriesOptions"
              :props="categoryDefaultParams"
              v-model="categoryId"
              :show-all-levels="false"
            ></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanCategory">清空</button>
              <button @click="handleCategoryChange">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="flow">
        <template #header>
          收支
          <el-popover
            ref="flowPopover"
            placement="right"
            trigger="manual"
            v-model:visible="flowVisible"
          >
            <template #reference>
              <el-button
                type="text"
                icon="el-icon-arrow-down"
                @click="flowVisible = !flowVisible"
              ></el-button>
            </template>
            <el-cascader
              ref="flowCascader"
              :options="flowOptions"
              :props="defaultParams"
              v-model="selectFlow"
              :show-all-levels="false"
            ></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanFlow">清空</button>
              <button @click="handleFlowChange">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="detailed" label="金额"></el-table-column>
      <el-table-column prop="account" width="100">
        <template #header>
          账户
          <el-popover
            ref="accountPopover"
            placement="right"
            trigger="manual"
            v-model:visible="accountVisible"
          >
            <template #reference>
              <el-button
                type="text"
                icon="el-icon-arrow-down"
                @click="accountVisible = !accountVisible"
              ></el-button>
            </template>
            <el-cascader
              ref="accountCascader"
              :options="accountOptions"
              :props="defaultParams"
              v-model="selectAccount"
              :show-all-levels="false"
            ></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanAccount">清空</button>
              <button @click="handleAccountChange">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="aim_account" width="100" label="目标账户">
      </el-table-column>
      <el-table-column
        prop="comment"
        label="备注"
        :show-overflow-tooltip="true"
        width="100"
      ></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button
            size="mini"
            type="text"
            @click="handleDelete(scope.$index, scope.row)"
            >删除</el-button
          >
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
import DateTimePicker from "@/components/DateTimePicker";

export default {
  name: "BookTable",
  components: { DateTimePicker },
  data() {
    return {
      categoryDefaultParams: {
        expandTrigger: "hover",
        label: "name",
        value: "id",
        children: "children",
        lazy: true,
        lazyLoad(node, resolve) {
          db.all(
            `select id,specific_category as name,'leaf'leaf from books_account_category_specific where parent_category_id = ?`,
            [node.data.id],
            (err, rows) => {
              if (err) {
                throw err;
              }
              resolve(rows);
            }
          );
        },
      },
      defaultParams: {
        expandTrigger: "hover",
        label: "name",
        value: "id",
      },
      tableData: [],
      totalPage: 0,
      accountName: {},
      accountType: {},
      categoryName: {},
      pageSize: 13,
      selectedTime: this.time,
      categoriesOptions: [],
      categoryNull: "null or",
      categoryId: this.category,
      categoryParam: this.category,
      flowOptions: [
        { id: "income", name: "收入" },
        { id: "consume", name: "支出" },
        { id: "transfer", name: "转账" },
      ],
      selectFlow: this.flow,
      flowParam: this.flow,
      accountOptions: [],
      selectAccount: this.account,
      accountParam: this.account,
      categoryVisible: false,
      flowVisible: false,
      accountVisible: false,
    };
  },
  //父组件传递过来的账户ID
  props: {
    account: {
      type: [String, Number],
      default: "%",
    },
    cellStyle: {
      type: Object,
      default: () => ({}),
    },
    time: {
      type: Array,
      default: () => {
        return ["0000-00-00", "now"];
      },
    },
    category: {
      type: [String, Number],
      default: "%",
    },
    flow: {
      type: String,
      default: "%",
    },
  },
  methods: {
    // 接收从记账组件传递过来的数据
    receive: function () {
      let flowlist = { consume: "支出", income: "收入", transfer: "转账" };
      this.$bus.on("appendTable", (row) => {
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
          aim_account_id: row.aim_account_id,
        });
      });
    },
    // 获取账户名
    getAccountName: function () {
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
          type: "warning",
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
          this.$notify({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch(() => {
          this.$notify({
            type: "info",
            message: "已取消删除",
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
          this.flowParam[0],
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
    async gettabledata(pageSize, page) {
      this.tableData = await db.asyncAll(
        `select i.name as account,b.account_info_id as account_id, case when b.flow = 'consume' then '支出' when b.flow = 'income' then '收入' 
        when b.flow = 'transfer' then '转账' end as flow,i2.name as aim_account,b.aim_account_id,s.specific_category as category,b.comment,
        strftime('%Y-%m-%d %H:%M',b.when_time) as date,b.detailed,b.flow as flowSign,b.id from books_account_book as b left join books_account_info as i
         on b.account_info_id = i.id left join books_account_info as i2 on b.aim_account_id = i2.id left join books_account_category_specific as s on 
         b.types_id = s.id where account_info_id like ? and (types_id is ` +
          this.categoryNull +
          ` types_id like ?) and when_time >= ? and when_time <= ? and flow like ? order by when_time desc limit ?
          offset ?`,
        [
          this.accountParam,
          this.categoryParam[this.categoryParam.length - 1],
          this.selectedTime[0],
          this.selectedTime[1],
          this.flowParam[0],
          pageSize,
          page,
        ]
      );
    },
    //当分类弹窗确定点击时
    handleCategoryChange: function () {
      if (this.categoryId.length) {
        this.categoryNull = "not null and";
        this.categoryParam = this.categoryId;
      } else {
        this.categoryNull = "null or";
        this.categoryParam = "%";
      }
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.categoryVisible = false;
    },
    //当分类弹窗清除点击时
    cleanCategory: function () {
      this.categoryNull = "null or";
      this.$refs["categoriesCascader"].handleClear();
      this.categoryId = this.category;
      this.categoryParam = this.category;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.categoryVisible = false;
    },
    cleanFlow: function () {
      this.selectFlow = "%";
      this.flowParam = "%";
      this.$refs.flowCascader.handleClear();
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.flowVisible = false;
    },
    handleFlowChange: function () {
      this.flowParam = this.selectFlow;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.flowVisible = false;
    },
    cleanAccount: function () {
      this.selectAccount = "%";
      this.accountParam = "%";
      this.$refs.accountCascader.handleClear();
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.accountVisible = false;
    },
    handleAccountChange: function () {
      this.accountParam = this.selectAccount[0];
      console.log(this.selectAccount[0]);
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.accountVisible = false;
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
    //获取账户
    getAccountOptions: async function () {
      return await db.asyncAll(`select id,name from books_account_info`, []);
    },
    // 初始化数据
    async getdata() {
      this.accountOptions = await this.getAccountOptions();
      this.categoriesOptions = await this.getSelect();
      this.accountName = await this.getAccountName();
      await this.getCategoryName();
      await this.getAccountType();
      await this.gettabledata(this.pageSize, 0);
      await this.gettotalpage();
    },
    getSelect: async function () {
      return await db.asyncAll(
        `select id,first_level as name from books_account_category_first`
      );
    },
  },
  created: function () {
    this.getdata();
  },
  mounted: function () {
    this.receive();
  },
  watch: {
    // 当父组件传递过来的账户ID发生改变
    account: function () {
      this.accountParam = this.account;
      this.gettabledata(this.pageSize, 0);
      this.gettotalpage();
    },
    selectedTime: function () {
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
    },
    time: function () {
      this.selectedTime = this.time;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
    },
    category: function () {
      this.categoryNull = "not null and";
      let tmp = [];
      tmp.push(this.category);
      this.categoryParam = tmp;
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
    },
  },
};
</script>
