<template>
  <el-tabs v-model="activeName">
    <!--支出-->
    <el-tab-pane label="支出" name="pay">
      <el-row v-if="quickButtons.length > 0" :gutter="20" style="margin-left: 10px;margin-bottom: 10px;">
        <el-button v-for="(button, index) in quickButtons" :key="index" :type="button.type" round
          @click="selectQuickButton(index)">
          {{ button.category }}
        </el-button>
      </el-row>
      <el-row v-if="quickAccountButtons.length > 0" :gutter="20" style="margin-left: 10px;margin-bottom: 10px;">
        <el-button v-for="(button, index) in quickAccountButtons" :key="index" :type="button.type" round
          @click="selectQuickAccountButton(index, button)">
          {{ button.name }}
        </el-button>
      </el-row>
      <el-form ref="detailform" :model="detailform" :inline="true" class="demo-form-inline" :rules="rules">
        <el-form-item label="分类" prop="category">
          <el-cascader :show-all-levels="false" :options="options" :clearable="true" :props="defaultParams"
            v-model="detailform.category" @change="handleChange" placeholder="请选择">
          </el-cascader>
        </el-form-item>
        <el-form-item label="账户" prop="account">
          <el-select v-model="detailform.account" placeholder="请选择" @change="handlePayAccountChange">
            <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="when">
          <el-date-picker v-model="detailform.when" type="datetime" placeholder="选择日期时间" format="HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="金额" prop="detailed">
          <el-input v-model.trim="detailform.detailed" placeholder="请输入金额"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="detailform.comment" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item style="width: 70px">
          <el-button @click="submitForm('detailform')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-tab-pane>
    <!--收入-->
    <el-tab-pane label="收入" name="income">
      <el-form ref="incomeDetailForm" :model="incomeDetailForm" :inline="true" class="demo-form-inline" :rules="rules">
        <el-form-item label="分类" prop="category">
          <el-cascader :show-all-levels="false" :props="defaultParams" :options="incomeOptions" :clearable="true"
            v-model="incomeDetailForm.category" @change="handleChange" :expandTrigger="'hover'" placeholder="请选择">
          </el-cascader>
        </el-form-item>
        <el-form-item label="账户" prop="account">
          <el-select v-model="incomeDetailForm.account" placeholder="请选择">
            <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="when">
          <el-date-picker v-model="incomeDetailForm.when" type="datetime" placeholder="选择日期时间" format="HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="金额" prop="detailed">
          <el-input v-model.trim="incomeDetailForm.detailed" placeholder="请输入金额"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="incomeDetailForm.comment" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item style="width: 70px">
          <el-button @click="submitIncomeForm('incomeDetailForm')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-tab-pane>
    <!--转账-->
    <el-tab-pane label="转账" name="transfer">
      <el-form ref="transferDetailForm" :model="transferDetailForm" :inline="true" class="demo-form-inline"
        :rules="rules">
        <el-form-item label="转出账户" prop="account">
          <el-select v-model="transferDetailForm.account" placeholder="请选择">
            <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="目标账户" prop="account">
          <el-select v-model="transferDetailForm.aimAccount" placeholder="请选择">
            <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="when">
          <el-date-picker v-model="transferDetailForm.when" type="datetime" placeholder="选择日期时间" format="HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="金额" prop="detailed">
          <el-input v-model.trim="transferDetailForm.detailed" placeholder="请输入金额"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="transferDetailForm.comment" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item style="width: 60px">
          <el-button @click="submitTransferForm('transferDetailForm')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-tab-pane>
  </el-tabs>
</template>


<script>
import { getCategory, getselectoptions_s, getAccountType_s, getselects, addBill, addTransfer, getLastBill, getMostFrequentType, getMostFrequentAccount } from '../tools/dbTools';

export default {
  name: "PayForm",
  data() {
    var checkdetailed = (rule, value, callback) => {
      Number(value) ? callback() : callback(new Error("请输入数字"));
    };
    return {
      quickButtons: [],
      quickAccountButtons: [],
      defaultParams: {
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
      detailform: {
        category: [],
        account: "",
        when: "",
        detailed: "",
        comment: null,
        categoryspecific: "",
        flow: "",
      },
      incomeDetailForm: {
        category: [],
        account: "",
        when: "",
        detailed: "",
        comment: null,
        categoryspecific: "",
        flow: "",
      },
      transferDetailForm: {
        account: [],
        aimAccount: "",
        when: "",
        detailed: "",
        comment: null,
        flow: "",
      },
      rules: {
        category: [{ required: true, message: "请选择类别", trigger: "blur" }],
        detailed: [
          { required: true, message: "请输入金额", trigger: "blur" },
          { validator: checkdetailed, trigger: "blur" },
        ],
        account: [{ required: true, message: "请选择账户", trigger: "blur" }],
        when: [{ required: true, message: "请选择时间", trigger: "blur" }],
      },
      options: [
        { id: 1, name: "食品酒水", children: [{ id: 1001, name: "早午晚餐" }] },
      ],
      incomeOptions: [],
      selectoptions: [],
      activeName: "pay",
      accountType: {},
    };
  },
  methods: {
    selectQuickButton(clickedIndex) {

      this.detailform.category = [this.quickButtons[clickedIndex]['pid'], this.quickButtons[clickedIndex]['id']];
      this.detailform.specificcategory = this.quickButtons[clickedIndex]['id']

      this.quickButtons = this.quickButtons.map((button, index) => {
        if (index === clickedIndex) {
          return { ...button, type: 'primary' };
        } else {
          return { ...button, type: '' };
        }
      })
    },
    selectQuickAccountButton(clickedIndex, clickedButton) {
      this.detailform.account = clickedButton.id
      this.quickAccountButtons = this.quickAccountButtons.map((button, index) => {
        if (index === clickedIndex) {
          return { ...button, type: 'primary' };
        } else {
          return { ...button, type: '' };
        }
      })
    },
    handlePayAccountChange(value) {
      const buttonIndex = this.quickAccountButtons.findIndex(button => button.id === value)
      if (buttonIndex !== -1) {
        this.quickAccountButtons = this.quickAccountButtons.map((button, index) => {
          if (index === buttonIndex) {
            return { ...button, type: 'primary' };
          } else {
            return { ...button, type: '' };
          }
        })
      } else {
        this.quickAccountButtons = this.quickAccountButtons.map((button, index) => {
          return { ...button, type: '' };
        })
      }
    },
    handleChange(value) {
      this.detailform.specificcategory = value[1];
      const buttonIndex = this.quickButtons.findIndex(button => button.id === value[1])
      if (buttonIndex !== -1) {
        this.quickButtons = this.quickButtons.map((button, index) => {
          if (index === buttonIndex) {
            return { ...button, type: 'primary' };
          } else {
            return { ...button, type: '' };
          }
        })
      } else {
        this.quickButtons = this.quickButtons.map((button, index) => {
          return { ...button, type: '' };
        })
      }
    },
    // 将添加的数据传递到账单显示组件
    sendRowdata() {

      getLastBill().then(r => { this.$bus.emit("appendTable", r) });

    },
    submitForm(detailform) {
      this.$refs[detailform].validate((valid) => {
        if (valid) {
          addBill(this.detailform.category[1],
            "consume",
            this.detailform.detailed,
            this.detailform.account,
            this.detailform.comment,
            this.detailform.when)
          this.sendRowdata()
          this.detailform.detailed = "";
          this.detailform.comment = "";
        } else {
          this.$notify({ type: "error", message: "提交失败" });
        }
      });
    },
    // 提交收入
    submitIncomeForm(incomeDetailForm) {
      this.$refs[incomeDetailForm].validate((valid) => {
        if (valid) {
          addBill(
            this.incomeDetailForm.category[1],
            "income",
            this.incomeDetailForm.detailed,
            this.incomeDetailForm.account,
            this.incomeDetailForm.comment,
            this.incomeDetailForm.when)
          this.sendRowdata()
          this.incomeDetailForm.detailed = "";
          this.incomeDetailForm.comment = "";
        } else {
          this.$notify({ type: "error", message: "提交失败" });
        }
      });
    },
    // 提交转账
    submitTransferForm(transferDetailForm) {
      this.$refs[transferDetailForm].validate((valid) => {
        if (valid) {
          addTransfer(
            this.transferDetailForm.detailed,
            this.transferDetailForm.account,
            this.transferDetailForm.aimAccount,
            this.transferDetailForm.comment,
            this.transferDetailForm.when,
          )
          this.sendRowdata()
          this.transferDetailForm.detailed = "";
        } else {
          this.$notify({ type: "error", message: "提交失败" });
        }
      });
    },
    getselectoptions() {
      return getselectoptions_s()
    },
    //获取账户类型，账户有资产账户和负债账户
    getAccountType() {
      return getAccountType_s()
    },
    getselect: async function (flow) {
      return getselects(flow)
    },
    getdata: function () {
      // 获取账户类型
      this.getselect("consume").then((value) => {
        this.options = value;
      });
      this.getselect("income").then((value) => {
        this.incomeOptions = value;
      });
      this.getselectoptions().then(r => { this.selectoptions = r })
      this.accountType = this.getAccountType();
    },
  },
  mounted: function () {
    this.getdata();
    //初始化快速选择按钮
    getMostFrequentType("consume").then((v) => {
      if (v.length > 0) {
        this.quickButtons = v.map(button => ({
          ...button,
          type: ''
        }))
      }
    });
    getMostFrequentAccount("consume").then((v) => {
      if (v.length > 0) {
        this.quickAccountButtons = v.map(button => ({
          ...button,
          type: ''
        }))
      }
    })
  },
};
</script>

<style scoped>
:deep(.el-input__inner) {
  height: 30px;
  width: 130px;
}

:deep(.el-form-item__content) {
  width: 150px;
}

.el-form-item {
  height: 20px;
}

:deep(.el-button) {
  height: 30px;
  padding: 0px 15px;
  border-radius: 100px;
}
</style>