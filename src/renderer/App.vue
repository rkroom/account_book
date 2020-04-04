<template>
  <div id="app">
    <el-container>
      <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
        <el-menu :default-openeds="openeds" :router="true">
          <el-submenu index="1">
            <template slot="title"><i class="el-icon-message"></i>记账</template>
            <el-menu-item-group>
              <el-menu-item index="/bookdetailed">账本</el-menu-item>
              <el-menu-item index="/bookaccount">账户</el-menu-item>
              <el-menu-item index="/bookmanage">管理</el-menu-item>
              <el-menu-item index="/bookanalysis">报表</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="2">
            <template slot="title"><i class="el-icon-menu"></i>日记</template>
            <el-menu-item-group>
              <el-menu-item index="/newdiary">新建</el-menu-item>
              <el-menu-item index="/listdiary">列表</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
          <el-submenu index="3">
            <template slot="title"><i class="el-icon-menu"></i>计划</template>
            <el-menu-item-group>
              <el-menu-item index="/goal">目标</el-menu-item>
              <el-menu-item index="/schedule">日程</el-menu-item>
            </el-menu-item-group>
          </el-submenu>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import db from '@/utils/sqdb'
import { ipcRenderer } from 'electron'
import { changePasswdConfig } from '@/utils/common'

export default {
  name: 'account_book',
  data () {
    return {
      //默认打开的导航
      openeds: ['1', '2', '3']
    }
  },
  created: function () { //vue生命周期，https://cn.vuejs.org/v2/guide/instance.html
    // 监听newdb事件，message为主进程发送的数据库文件路径与文简明
    ipcRenderer.on('newdb', (event, message) => {
      this.$prompt('请输入密码', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        //关闭数据库连接
        db.close()
        // 修改配置文件中的密码
        changePasswdConfig(false, null)
        // 将文件路径和密码发送到主进程监听的newdb事件
        ipcRenderer.send('newdb', { dbfile: message, password: value })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消'
        })
      })
    })
    // 监听changedb
    ipcRenderer.on('changedb', (event, message) => {
      this.$prompt('请输入密码', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        db.run(`PRAGMA rekey = '` + value + `'`)
        // 修改配置文件中的密码
        changePasswdConfig(false, null)
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '取消'
        })
      })
    })
  }
}
</script>

<style>
/* CSS */
</style>
