<template>
  <div>
    <!--表格组件-->
    <el-table :data="tableData" :cell-style="cellStyle">
      <el-table-column prop="date" width="150">
        <template #header>
          日期
          <DateTimePicker v-model="selectedTime"></DateTimePicker>
        </template>
      </el-table-column>
      <el-table-column prop="category">
        <template #header>
          分类
          <el-popover ref="categoryPopover" placement="right" trigger="manual" v-model:visible="categoryVisible">
            <template #reference>
              <el-button link icon="ArrowDownBold" @click="categoryVisible = !categoryVisible"></el-button>
            </template>
            <el-cascader ref="categoriesCascader" :options="categoriesOptions" :props="categoryDefaultParams"
              v-model="categoryId" :show-all-levels="false" :teleported=false></el-cascader>
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
          <el-popover ref="flowPopover" placement="right" trigger="manual" v-model:visible="flowVisible">
            <template #reference>
              <el-button link icon="ArrowDownBold" @click="flowVisible = !flowVisible"></el-button>
            </template>
            <el-cascader ref="flowCascader" :options="flowOptions" :props="defaultParams" v-model="selectFlow"
              :show-all-levels="false" :teleported=false></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanFlow">清空</button>
              <button @click="handleFlowChange">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="detailed" label="金额"></el-table-column>
      <el-table-column prop="account" width="120">
        <template #header>
          账户
          <el-popover ref="accountPopover" placement="right" trigger="manual" v-model:visible="accountVisible">
            <template #reference>
              <el-button link icon="ArrowDownBold" @click="accountVisible = !accountVisible"></el-button>
            </template>
            <el-cascader ref="accountCascader" :options="accountOptions" :props="defaultParams" v-model="selectAccount"
              :show-all-levels="false" :teleported=false></el-cascader>
            <div class="el-table-filter__bottom">
              <button @click="cleanAccount">清空</button>
              <button @click="handleAccountChange">确定</button>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="aim_account" width="120" label="目标账户">
      </el-table-column>
      <el-table-column prop="comment" label="备注" :show-overflow-tooltip="true" width="100"></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link @click="handleDelete(scope.$index, scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination background layout="prev, pager, next" :total="totalPage" :page-size="pageSize"
      @current-change="handlePage" />
  </div>
</template>
<script>
import DateTimePicker from "./DateTimePicker.vue";
import {
  getCategory,
  getAccountNames,
  deleteBill,
  gettotalpages,
  gettabledata_s,
  getAccountType_s,
  getCategoryName_s,
  getAccountIDName,
  getSelect_s,
} from '../tools/dbTools'

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
          getCategory(node.data.id).then(r => {
            resolve(r)
          })
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
    getAccountName: function () {
      return getAccountNames()
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
          deleteBill(row.id);
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
      gettotalpages(
        this.categoryNull,
        this.categoryParam[this.categoryParam.length - 1],
        this.accountParam,
        this.selectedTime[0],
        this.selectedTime[1],
        this.flowParam[0],
      ).then(r => { this.totalPage = r.count })
    },
    // 获取数据
    async gettabledata(pageSize, page) {
      this.tableData = await gettabledata_s(
        this.categoryNull,
        this.accountParam,
        this.categoryParam[this.categoryParam.length - 1],
        this.selectedTime[0],
        this.selectedTime[1],
        this.flowParam[0],
        pageSize,
        page,
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
      this.gettotalpage();
      this.gettabledata(this.pageSize, 0);
      this.accountVisible = false;
    },
    // 获取账户类型
    getAccountType() {
      this.accountType = getAccountType_s();
    },
    // 获取分类名
    getCategoryName() {
      this.categoryName = getCategoryName_s();
    },
    //获取账户
    getAccountOptions: async function () {
      return await getAccountIDName();
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
      return await getSelect_s()
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