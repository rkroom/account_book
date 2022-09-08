<template>
  <!--如果没有记住密码，或者记住的密码错误则需要重新输入密码-->
  <el-dialog title="密码" v-model="dialogFormVisible" :close-on-click-modal="false" width="30%"
    :before-close="beforeclose">
    <el-form ref="passwordForm" :model="passwordForm" :rules="rules" @submit.prevent>
      <el-form-item label="密码：" prop="password">
        <el-input v-model="passwordForm.password" style="width: 150px" show-password></el-input>
        <el-checkbox v-model="passwordForm.saveStatus">记住密码</el-checkbox>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelPassword">取 消</el-button>
        <el-button type="primary" @click="confirmPassword('passwordForm')">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
let db = window.electronAPI.db

export default {
  name: "init-page",
  data() {
    // 检测输入的密码是否正确
    var checkdetailed = (rule, value, callback) => {
      db.run(`PRAGMA KEY = '` + value + `'`);
      db.run(`select * from sqlite_sequence`, (info) => {
        if (info) {
          return callback(
            new Error(
              "请输入正确的密码，如果是第一次运行本软件，请先创建账本。"
            )
          );
        } else {
          return callback();
        }
      });
    };
    return {
      dialogFormVisible: false,
      passwordForm: {
        password: "",
        saveStatus: true,
      },
      rules: {
        password: [{ validator: checkdetailed, trigger: "blur" }],
      },
      beforeclose: function (done) {
        window.electronAPI.quitApp(); //通过IPC通知主进程关闭应用
      },
      passwd: "",
    };
  },
  methods: {
    cancelPassword() {
      // 取消输入则关闭应用
      window.electronAPI.quitApp();
    },
    confirmPassword(passwordForm) {
      // 检测密码是否符合规则
      this.$refs[passwordForm].validate((valid) => {
        if (valid) {
          this.dialogFormVisible = false;
          // 修改密码设置
          window.electronAPI.changePasswdConfig(
            {
              isSave: this.passwordForm.saveStatus,
              password: this.passwordForm.password
            }
          );
          // 密码符合规则则转入bookdetailed页面
          this.$router.push("/bookdetailed");
        }
      });
    },
  },
  created: function () {
    //vue声明周期
    //获取密码
    window.electronAPI.getPasswd().then(r => {
      this.passwd = r
      if (this.passwd !== null) {
        //如果密码非空，则检验密码
        db.run(`PRAGMA KEY = '` + this.passwd + `'`);
        db.run(`select * from sqlite_sequence`, (info) => {
          if (info) {
            // 密码错误则弹出密码输入界面
            this.dialogFormVisible = true;
          } else {
            // 密码正确则转入/bookdetailed
            this.$router.push("/bookdetailed");
          }
        });
      } else {
        //如果密码为空则弹出密码输入对话框
        this.dialogFormVisible = true;
      }
    });

  },
};
</script>   