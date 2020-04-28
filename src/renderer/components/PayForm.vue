<template>
  <!--利用标签组件，https://element.eleme.cn/#/zh-CN/component/tabs-->
  <el-tabs v-model="activeName" @tab-click="handleClick">
    <!--支出-->
    <el-tab-pane label="支出" name="pay">
      <el-form ref="detailform" :model="detailform" :inline="true" class="demo-form-inline" :rules="rules">
        <el-form-item label="分类" prop="category">
          <el-cascader :show-all-levels="false"  :options="options" :clearable="true" :props="defaultParams"
            v-model="detailform.category" @change="handleChange" >
          </el-cascader>
        </el-form-item>
        <el-form-item label="账户" prop="account">
          <el-select v-model="detailform.account" placeholder="请选择">
            <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="when">
          <el-date-picker v-model="detailform.when" value-format="yyyy-MM-dd HH:mm:ss" type="datetime"
            placeholder="选择日期时间" format="HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="金额" prop="detailed">
          <el-input v-model.trim="detailform.detailed" placeholder="请输入金额"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="detailform.comment" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item style="width:70px;">
          <el-button @click="submitForm('detailform')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-tab-pane>
    <!--收入-->
    <el-tab-pane label="收入" name="income">
      <el-form ref="incomeDetailForm" :model="incomeDetailForm" :inline="true" class="demo-form-inline" :rules="rules">
        <el-form-item label="分类" prop="category">
          <el-cascader :show-all-levels="false" :props="defaultParams" :options="incomeOptions" :clearable="true"
            v-model="incomeDetailForm.category" @change="handleChange" :expandTrigger = "'hover'">
          </el-cascader>
        </el-form-item>
        <el-form-item label="账户" prop="account">
          <el-select v-model="incomeDetailForm.account" placeholder="请选择">
            <el-option v-for="item in selectoptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="when">
          <el-date-picker v-model="incomeDetailForm.when" value-format="yyyy-MM-dd HH:mm:ss" type="datetime"
            placeholder="选择日期时间" format="HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="金额" prop="detailed">
          <el-input v-model.trim="incomeDetailForm.detailed" placeholder="请输入金额"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="incomeDetailForm.comment" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item style="width:70px;">
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
          <el-date-picker v-model="transferDetailForm.when" value-format="yyyy-MM-dd HH:mm:ss" type="datetime"
            placeholder="选择日期时间" format="HH:mm:ss">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="金额" prop="detailed">
          <el-input v-model.trim="transferDetailForm.detailed" placeholder="请输入金额"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="transferDetailForm.comment" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item style="width:60px;">
          <el-button @click="submitTransferForm('transferDetailForm')">提交</el-button>
        </el-form-item>
      </el-form>
    </el-tab-pane>
  </el-tabs>
</template>

<script>
import db from '@/utils/sqdb'
import vm from '@/components/event.js' //借助第三方进行兄弟组件间的通信
// 获取账户信息
function getselectoptions () {
  let selectoptions = []
  db.each(`select * from books_account_info`, [], (err, row) => {
    let option = { value: 1, label: 'default' }
    if (err) {
      throw err
    }
    option.value = row.id
    option.label = row.name
    selectoptions.push(option)
  })
  return selectoptions
}
//获取账户类型，账户有资产账户和负债账户
function getAccountType () {
  let accountTypes = {}
  db.each(`select * from books_account_info`, [], (err, row) => {
    if (err) {
      throw err
    }
    accountTypes[row.id] = row.type
  })
  return accountTypes
}
// 获取收支分类
function getselect (flow) {
  return new Promise(function (resolve, reject) {
    let options = []
    db.each(`select * from books_account_category_first where flow_sign = ?`, [flow], (err, row) => {
      if (err) {
        reject(err)
      }
      let firstcategory = { id: 1, name: 'default', children: [] }
      let specific = []
      function getspecifik (row) {
        db.each(`select * from books_account_category_specific where parent_category_id = ?`, [row.id], (err, row) => {
          if (err) {
            reject(err)
          }
          let specificcategory = { id: 1, name: 'default' }
          specificcategory.id = row.id
          specificcategory.name = row.specific_category
          specific.push(specificcategory)
        })
      }
      getspecifik(row)
      firstcategory.id = row.id
      firstcategory.name = row.first_level
      firstcategory.children = specific
      options.push(firstcategory)
    })
    resolve(options)
  })
}
export default {
  name: 'PayForm',
  data () {
    // 检查金额是否符合规范
    var checkdetailed = (rule, value, callback) => {
      Number(value) ? callback() : callback(new Error('请输入数字'))
    }
    return {
      defaultParams: {
        expandTrigger: 'hover',
        label: 'name',
        value: 'id',
        children: 'children'
      },
      detailform: {
        category: [],
        account: '',
        when: '',
        detailed: '',
        comment: null,
        categoryspecific: '',
        flow: ''
      },
      incomeDetailForm: {
        category: [],
        account: '',
        when: '',
        detailed: '',
        comment: null,
        categoryspecific: '',
        flow: ''
      },
      transferDetailForm: {
        account: [],
        aimAccount: '',
        when: '',
        detailed: '',
        comment: null,
        flow: ''
      },
      rules: {
        category: [{ required: true, message: '请选择类别', trigger: 'blur' }],
        detailed: [{ required: true, message: '请输入金额', trigger: 'blur' }, { validator: checkdetailed, trigger: 'blur' }],
        account: [{ required: true, message: '请选择账户', trigger: 'blur' }],
        when: [{ required: true, message: '请选择时间', trigger: 'blur' }]
      },
      options: [],
      incomeOptions: [],
      selectoptions: [],
      activeName: 'pay',
      accountType: {}
    }
  },
  methods: {
    handleClick (tab, event) {
    },
    // 当选项发生改变时
    handleChange (value) {
      this.detailform.specificcategory = value[1]
    },
    // 将添加的数据传递到账单显示组件
    sendRowdata () {
      db.get(`SELECT * from books_account_book order by id desc limit 1`, [], (err, row) => {
        if (err) {
          throw err
        }
        vm.$emit('appendTable', row)
      })
    },
    // 提交支出
    submitForm (detailform) {
      this.$refs[detailform].validate((valid) => {
        if (valid) {
          // 如果账户为资产账户
          if (this.accountType[this.detailform.account] === 'asset') {
            db.serialize(() => {
              db.run(`BEGIN TRANSACTION`)
              db.run(`INSERT INTO books_account_book(types_id,flow,detailed,account_info_id,comment,when_time) values (?,?,?,?,?,?)`,
                [this.detailform.category[1], 'consume', this.detailform.detailed, this.detailform.account, this.detailform.comment, this.detailform.when]
              )
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [this.detailform.detailed, this.detailform.account])
              db.run(`COMMIT`)
              this.sendRowdata()
            })
          } else {
            db.serialize(() => {
              db.run(`BEGIN TRANSACTION`)
              db.run(`INSERT INTO books_account_book(types_id,flow,detailed,account_info_id,comment,when_time) values (?,?,?,?,?,?)`,
                [this.detailform.category[1], 'consume', this.detailform.detailed, this.detailform.account, this.detailform.comment, this.detailform.when]
              )
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [this.detailform.detailed, this.detailform.account])
              db.run(`COMMIT`)
              this.sendRowdata()
            })
          }
          this.detailform.detailed = ''
          this.detailform.comment = ''
        } else {
          this.$notify({ type: 'error', message: '提交失败' })
        }
      })
    },
    // 提交收入
    submitIncomeForm (incomeDetailForm) {
      this.$refs[incomeDetailForm].validate((valid) => {
        if (valid) {
          // 如果账户为资产账户
          if (this.accountType[this.incomeDetailForm.account] === 'asset') {
            db.serialize(() => {
              db.run(`BEGIN TRANSACTION`)
              db.run(`INSERT INTO books_account_book(types_id,flow,detailed,account_info_id,comment,when_time) values (?,?,?,?,?,?)`,
                [this.incomeDetailForm.category[1], 'income', this.incomeDetailForm.detailed, this.incomeDetailForm.account, this.incomeDetailForm.comment, this.incomeDetailForm.when])
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [this.incomeDetailForm.detailed, this.incomeDetailForm.account])
              db.run(`COMMIT`)
              this.sendRowdata()
            })
          } else {
            db.serialize(() => {
              db.run(`BEGIN TRANSACTION`)
              db.run(`INSERT INTO books_account_book(types_id,flow,detailed,account_info_id,comment,when_time) values (?,?,?,?,?,?)`,
                [this.incomeDetailForm.category[1], 'income', this.incomeDetailForm.detailed, this.incomeDetailForm.account, this.incomeDetailForm.comment, this.incomeDetailForm.when])
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [this.incomeDetailForm.detailed, this.incomeDetailForm.account])
              db.run(`COMMIT`)
              this.sendRowdata()
            })
          }
          this.incomeDetailForm.detailed = ''
          this.incomeDetailForm.comment = ''
        } else {
          this.$notify({ type: 'error', message: '提交失败' })
        }
      })
    },
    // 提交转账
    submitTransferForm (transferDetailForm) {
      this.$refs[transferDetailForm].validate((valid) => {
        if (valid) {
          // 如果转出账户类型和转入账户类型相同
          if (this.accountType[this.transferDetailForm.account] === this.accountType[this.transferDetailForm.aimAccount]) {
            db.serialize(() => {
              db.run(`BEGIN TRANSACTION`)
              db.run(`INSERT INTO books_account_book(flow,detailed,account_info_id,aim_account_id,comment,when_time) values (?,?,?,?,?,?)`,
                ['transfer', this.transferDetailForm.detailed, this.transferDetailForm.account, this.transferDetailForm.aimAccount, this.transferDetailForm.comment, this.transferDetailForm.when]
              )
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [this.transferDetailForm.detailed, this.transferDetailForm.account])
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [this.transferDetailForm.detailed, this.transferDetailForm.aimAccount])
              db.run(`COMMIT`)
              this.sendRowdata()
            })
            // 如果转出账户为资产类型
          } else if (this.accountType[this.transferDetailForm.account] === 'asset') {
            db.serialize(() => {
              db.run(`BEGIN TRANSACTION`)
              db.run(`INSERT INTO books_account_book(flow,detailed,account_info_id,aim_account_id,comment,when_time) values (?,?,?,?,?,?)`,
                ['transfer', this.transferDetailForm.detailed, this.transferDetailForm.account, this.transferDetailForm.aimAccount, this.transferDetailForm.comment, this.transferDetailForm.when]
              )
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [this.transferDetailForm.detailed, this.transferDetailForm.account])
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [this.transferDetailForm.detailed, this.transferDetailForm.aimAccount])
              db.run(`COMMIT`)
              this.sendRowdata()
            })
            // 如果转出账户类型为负债
          } else if (this.accountType[this.transferDetailForm.account] === 'debt') {
            db.serialize(() => {
              db.run(`BEGIN TRANSACTION`)
              db.run(`INSERT INTO books_account_book(flow,detailed,account_info_id,aim_account_id,comment,when_time) values (?,?,?,?,?,?)`,
                ['transfer', this.transferDetailForm.detailed, this.transferDetailForm.account, this.transferDetailForm.aimAccount, this.transferDetailForm.comment, this.transferDetailForm.when]
              )
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [this.transferDetailForm.detailed, this.transferDetailForm.account])
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [this.transferDetailForm.detailed, this.transferDetailForm.aimAccount])
              db.run(`COMMIT`)
              this.sendRowdata()
            })
          } else {
            // 提交失败
            this.$notify({ type: 'error', message: '提交失败' })
          }
          this.transferDetailForm.detailed = ''
        } else {
          this.$notify({ type: 'error', message: '提交失败' })
        }
      })
    },
    getdata: function () {
      // 获取账户类型
      getselect('consume').then(value => { this.options = value })
      getselect('income').then(value => { this.incomeOptions = value })
      this.selectoptions = getselectoptions()
      this.accountType = getAccountType()
    }
  },
  created: function () {
    // 获取账户类型
    this.getdata()
  }
}
</script>

<style scoped>
.el-input >>> .el-input__inner {
  width: 150px;
  height: 30px;
}
.el-cascader >>> .el-input__inner {
  width: 150px;
  height: 30px;
}
.el-select >>> .el-input__inner {
  width: 150px;
  height: 30px;
}
.el-form-item >>> .el-form-item__content {
  width: 150px;
}
.el-form-item {
  height: 20px;
}
.el-form-item >>> .el-button {
  height: 30px;
  padding: 0px 15px;
  border-radius: 100px;
}
</style>
