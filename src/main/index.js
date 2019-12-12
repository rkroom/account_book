import { app, BrowserWindow, Menu, ipcMain } from 'electron' //引入相关模块
import initializeDb from './utils/db'
import path from 'path'
import fse from 'fs-extra'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

// 配置文件路径，app.getPath：https://electronjs.org/docs/api/app
// 路径为C:\Users\用户名\AppData\Roaming\Electron
const configFile = path.join(app.getPath('userData'), 'config.json')
// 配置文件默认值
var config = {
  'dbpath': path.join(app.getPath('userData'), 'default.sqlite3'),
  'name': 'account book',
  'version': '0.0.1',
  'password': null
}
function changeConfig (filename) {
  // 如果配置文件存在
  if (fse.existsSync(configFile)) {
    // 读取配置文件并且转换为JSON对象
    config = JSON.parse(fse.readFileSync(configFile))
    // 修改数据库文件路径
    config.dbpath = filename
    // 重新写入配置
    fse.writeFileSync(configFile, JSON.stringify(config))
  } else {
    // 确保配置文件存在
    fse.ensureFileSync(configFile)
    // 修改数据库路径
    config.dbpath = filename
    // 重新写入配置文件
    fse.writeFileSync(configFile, JSON.stringify(config))
  }
}

// 监听newdb
ipcMain.on('newdb', (event, message) => {
  // 修改配置文件
  changeConfig(message.dbfile)
  // 初始化数据库
  initializeDb(message.dbfile, message.password)
  // 重启窗口
  mainWindow.close()
  createWindow()
})

const { dialog } = require('electron') //引入对话框
const template = [{ //菜单栏模板
  label: '文件', //文件菜单
  submenu: [{
    label: '打开', //标签
    accelerator: 'CmdOrCtrl+O', //快捷键
    role: 'open', //角色
    click () { //点击后操作
      dialog.showOpenDialog({ //打开文件对话框
        title: '打开文件',
        filters: [ //文件过滤器
          { name: '数据库', extensions: ['bd'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      }).then((filename) => {
        // filePaths为一个数组
        changeConfig(filename.filePaths[0])
        // 重启窗口
        mainWindow.reload()
      })
    }
  }, {
    label: '新建',
    accelerator: 'CmdOrCtrl+N',
    role: 'new',
    click () {
      dialog.showSaveDialog({
        title: '新建文件',
        filters: [
          { name: '数据库', extensions: ['bd'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      }).then(filename => {
        // dialog.showSaveDialog是一个promise，关于promise可以查看https://www.liaoxuefeng.com/wiki/1022910821149312/1023024413276544
        // 向renderer发送newdb消息
        mainWindow.webContents.send('newdb', filename.filePath)
      })
    }
  }, {
    label: '修改密码',
    click () {
      // 向renderer发送changedb消息
      mainWindow.webContents.send('changedb', null)
    }
  }, {
    label: '退出',
    role: 'quit',
    click () {
      app.quit() //退出程序
    }
  }]
},
{
  label: '编辑',
  submenu: [{
    label: '复制',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: '粘贴',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }]
}, {
  label: '帮助',
  role: 'help',
  submenu: [{
    label: '学习更多',
    click: async () => {
      const { shell } = require('electron') //引入shell模块
      await shell.openExternal('https://rkroom.com') //跳转到网站
    }
  }]
}]

const menu = Menu.buildFromTemplate(template) //设置菜单模板
Menu.setApplicationMenu(menu) //设置菜单

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
