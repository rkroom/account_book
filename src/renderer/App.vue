<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import db from '@/utils/sqdb'
import { ipcRenderer } from 'electron'
import { changePasswdConfig } from '@/utils/common'

export default {
  name: 'account_book',
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
