<template>
  <!--如果没有记住密码，或者记住的密码错误则需要重新输入密码-->
  <el-dialog title="密码" :visible="dialogFormVisible" :close-on-click-modal="false" width="30%"
    :before-close="beforeclose" :validate-on-rule-change="false">
    <el-form ref="passwordForm" :model="passwordForm" :rules="rules" @submit.native.prevent>
      <el-form-item label="密码：" prop="password">
        <el-input v-model="passwordForm.password" style="width:150px" show-password></el-input>
        <el-checkbox v-model="passwordForm.saveStatus">记住密码</el-checkbox>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="cancelPassword">取 消</el-button>
      <el-button type="primary" @click="confirmPassword('passwordForm')">确 定</el-button>
    </div>
  </el-dialog>
</template>
<script>
import db from '@/utils/sqdb.js' //初始化数据库
import { getPasswd, changePasswdConfig } from '@/utils/common' //获取密码和修改密码

export default {
  name: 'init-page',
  data () {
    // 检测输入的密码是否正确
    var checkdetailed = (rule, value, callback) => {
      db.run(`PRAGMA KEY = '` + value + `'`)
      db.run(`select * from sqlite_sequence`, (info) => {
        if (info) {
          return callback(new Error('请输入正确的密码'))
        } else {
          return callback()
        }
      })
    }
    return {
      dialogFormVisible: false,
      passwordForm: {
        password: '',
        saveStatus: true
      },
      rules: {
        password: [{ validator: checkdetailed, trigger: 'blur' }]
      },
      beforeclose: function (done) {
        require('electron').remote.app.quit() //通过remote模块关闭应用
      },
      passwd: ''
    }
  },
  methods: {
    cancelPassword () {
      // 取消输入则关闭应用
      require('electron').remote.app.quit()
    },
    confirmPassword (passwordForm) {
      // 检测密码是否符合规则
      this.$refs[passwordForm].validate((valid) => {
        if (valid) {
          console.log("123")
          this.dialogFormVisible = false
          // 修改密码设置
          changePasswdConfig(this.passwordForm.saveStatus, this.passwordForm.password)
          // 密码符合规则则转入bookdetailed页面
          this.$router.push('/bookdetailed')
        }
      })
    }
  },
  created: function () { //vue声明周期
    this.passwd = getPasswd() //获取密码
    if (this.passwd !== null) { //如果密码非空，则检验密码
      db.run(`PRAGMA KEY = '` + this.passwd + `'`)
      db.run(`select * from sqlite_sequence`, (info) => {
        if (info) {
          // 密码错误则弹出密码输入界面
          this.dialogFormVisible = true
        } else {
          // 密码正确则转入/bookdetailed
          this.$router.push('/bookdetailed')
        }
      })
    } else { //如果密码为空则弹出密码输入对话框
      this.dialogFormVisible = true
    }
  }
}
</script>