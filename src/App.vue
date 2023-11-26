<template>
  <div id="app">
    <el-container style="border: 1px solid #eee">
      <el-aside width="200px">
        <el-menu :default-openeds="openeds" :router="true">
          <el-sub-menu index="1">
            <template #title><i class="el-icon-message"></i>记账</template>
            <el-menu-item-group>
              <el-menu-item index="/bookdetailed">账本</el-menu-item>
              <el-menu-item index="/bookaccount">账户</el-menu-item>
              <el-menu-item index="/bookmanage">管理</el-menu-item>
              <el-menu-item index="/bookanalysis">报表</el-menu-item>
              <el-menu-item index="/importAndExport">导入</el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
          <el-sub-menu index="2">
            <template #title><i class="el-icon-menu"></i>日记</template>
            <el-menu-item-group>
              <el-menu-item index="/newdiary">新建</el-menu-item>
              <el-menu-item index="/listdiary">列表</el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
          <el-sub-menu index="3">
            <template #title><i class="el-icon-menu"></i>计划</template>
            <el-menu-item-group>
              <el-menu-item index="/goal">目标</el-menu-item>
              <el-menu-item index="/schedule">日程</el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { changeDbPassword } from './tools/dbTools'

export default {
  name: "account_book",
  data() {
    return {
      //默认打开的导航
      openeds: ["1", "2", "3"],
    };
  },
  created: function () {
    // 监听newdb事件，message为主进程发送的数据库文件路径与文简明
    window.electronAPI.newDb((event, message) => {
      this.$prompt("请输入密码", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }).then((r) => {
          window.electronAPI.newDbSend({ dbfile: message, password: r.value })
        }).catch(() => {
           this.$notify({
            type: "info",
            message: "取消",
          })
        })
    })
    window.electronAPI.changeDb((event, message) => {
      this.$prompt("请输入密码", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      })
        .then(({ value }) => {
          changeDbPassword(value).then(()=>{
          // 修改配置文件中的密码
          window.electronAPI.changePasswdConfig(
            {
              isSave: false,
              password: null
            })
          window.electronAPI.reloadWin()
          })
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "取消",
          });
        });
    });
    this.$router.push("/")
  }
}
</script>