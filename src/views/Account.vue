<template>
  <div>
    <el-table :data="accountTableData" style="width: 100%" @row-click="handleRowClick" ref="accountTable"
      :row-key="getRowKeys" :expand-row-keys="expands">
      <el-table-column type="expand">
        <template #default>
          <!--显示该账户下的账单-->
          <BookTable :account="accountId" :cellStyle="cellStyle"></BookTable>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="账户"> </el-table-column>
      <!--修改账户名-->
      <el-table-column label="账户名称">
        <template v-slot="scope">
          <el-button  link @click.stop="handleEditAccountName(scope.$index, scope.row)">修改名称
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型"> </el-table-column>
      <el-table-column prop="balance" label="金额"> </el-table-column>
    </el-table>
    <el-pagination :hide-on-single-page="true" background layout="prev, pager, next" :total="totalPage" :page-size="15"
      @current-change="handlePage">
    </el-pagination>
    <br />
    <!--添加账户-->
    <el-form ref="accountForm" :model="accountForm" :inline="true" class="demo-form-inline" :rules="rules">
      <el-form-item label="账户名称" prop="name">
        <el-input v-model="accountForm.name" placeholder="请输入账户名称"></el-input>
      </el-form-item>
      <el-form-item label="账户类型" prop="type">
        <el-select v-model="accountForm.type" placeholder="请选择" default-first-option>
          <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="初始金额" prop="amount">
        <el-input v-model.trim="accountForm.amount" placeholder="请输入金额"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="submitForm('accountForm')">提交</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
import BookTable from "../components/BookTable.vue";
import { UpdateAccountName,addAccount,getAccountCount,getAccountInfo_a } from "../tools/dbTools"
const pageSize = 15; //分页

export default {
  name: "accountdetail",
  components: { BookTable },
  data() {
    var checkAmount = (rule, value, callback) => {
      if (value === 0) {
        return callback();
      }
      Number(value) ? callback() : callback(new Error("请输入数字"));
    };
    return {
      accountTableData: [],
      totalPage: 0,
      accountForm: {
        name: "",
        type: "",
        amount: 0,
      },
      selectoptions: [
        {
          value: "asset",
          label: "资产",
        },
        {
          value: "debt",
          label: "负债",
        },
      ],
      rules: {
        name: [{ required: true, message: "请输入账户名称", trigger: "blur" }],
        amount: [
          { required: true, message: "请输入金额", trigger: "blur" },
          { validator: checkAmount, trigger: "blur" },
        ],
        type: [{ required: true, message: "请选择账户类型", trigger: "blur" }],
      },
      accountId: "",
      cellStyle: { padding: 0, background: "#F0FFFF" },
      getRowKeys(row) {
        return row.id;
      },
      expands: [],
    };
  },
  methods: {
    handlePage(value) {
      this.getAccountInfo(pageSize, (value - 1) * pageSize);
    },
    /*** 
    handleEdit(index, row) {
      this.$prompt("请输入 " + row.name + " 的金额", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        // 校验输入的是否为数字
        inputPattern: /^\d+$|^\d+\.\d+$|^-\d+$|^-\d+\.\d+$/,
        inputErrorMessage: "金额为数字，不能以小数点结尾",
      })
        .then(({ value }) => {
          UpdateAmount(value, row.id)
          row.amount = value;
          this.$notify({
            type: "success",
            message: "现在 " + row.name + " 金额为: " + value,
          });
        })
        .catch(() => {
          this.$notify({
            type: "info",
            message: "取消输入",
          });
        });
    },
    ***/
    handleEditAccountName(index, row) {
      this.$prompt("请输入 " + row.name + " 的新账户名称", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      })
        .then(({ value }) => {
          UpdateAccountName(value, row.id);
          let oldNmae = row.name;
          row.name = value;
          this.$notify({
            type: "success",
            message: oldNmae + " 已修改为: " + value,
          });
        })
        .catch(() => {
          this.$notify({
            type: "info",
            message: "取消输入",
          });
        });
    },
    // 点击账单所在的行后展开该行并且显示该行所属账户的账单
    handleRowClick(row) {
      this.accountId = row.id;
      if (this.expands.length) {
        if (this.expands.indexOf(row.id) > -1) {
          this.expands = [];
        } else {
          this.expands = [];
          this.expands.push(row.id);
        }
      } else {
        this.expands.push(row.id);
      }
    },
    submitForm(accountForm) {
      this.$refs[accountForm].validate((valid) => {
        let accountTypeList = { asset: "资产", debt: "负债" };
        if (valid) {
          addAccount(this.accountForm.name, this.accountForm.amount, this.accountForm.type);
          let newAccount = { name: "default", type: "asset", balance: "0" };
          newAccount["name"] = this.accountForm.name;
          newAccount["type"] = accountTypeList[this.accountForm.type];
          newAccount["balance"] = this.accountForm.amount;
          if (this.accountForm.type == "debt"){
            newAccount["balance"] = -newAccount["balance"];
          }
          this.accountTableData.push(newAccount);
          this.accountForm.name = "";
          this.accountForm.amount = 0;
        } else {
          this.$notify({ type: "error", message: "提交失败" });
        }
      });
    },
    gettotalpage() {
      getAccountCount().then(row => { this.totalPage = row.count })
    },
    getAccountInfo(pageSize, page) {
      getAccountInfo_a(pageSize,page).then(r=>{this.accountTableData = r})
    },
  },
  created: function () {
    this.getAccountInfo(pageSize, 0);
    this.gettotalpage();
  },
};
</script>