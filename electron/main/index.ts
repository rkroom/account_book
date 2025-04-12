import { app, BrowserWindow, shell, ipcMain, dialog, Menu } from 'electron';
import { release } from 'os'
import { join } from 'path'
import { configFile } from '../utils/config'
import { changeConfig, changePasswdConfig, getPasswd } from '../utils/common'
import initializeDb from '../utils/db'
import * as fsExtra from 'fs-extra';

if (process.env.NODE_ENV === "development" || (import.meta as any).env.DEV) {
  console.log("check config file")
  console.log(configFile)
}


app.disableHardwareAcceleration()
// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

(<any>global).shareObject = {
  configFile: configFile
};

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export const ROOT_PATH = {
  // /dist
  dist: join(__dirname, '../..'),
  // /dist or /public
  public: join(__dirname, app.isPackaged ? '../..' : '../../../public'),
}

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url: any = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(ROOT_PATH.dist, 'index.html')

require('@electron/remote/main').initialize()
const template: any = [
  {
    //菜单栏模板
    label: "文件", //文件菜单
    submenu: [
      {
        label: "打开", //标签
        accelerator: "CmdOrCtrl+O", //快捷键
        role: "open", //角色
        click() {
          //点击后操作
          dialog
            .showOpenDialog({
              //打开文件对话框
              title: "打开文件",
              filters: [
                //文件过滤器
                { name: "数据库", extensions: ["bd"] },
                { name: "All Files", extensions: ["*"] },
              ],
            })
            .then((filename) => {
              if (filename.filePaths.length != 0) {
                // filePaths为一个数组
                changeConfig({ dbpath: filename.filePaths[0] });
                // 重启窗口
                win?.close()
                createWindow()
              }
            });
        },
      },
      {
        label: "新建",
        accelerator: "CmdOrCtrl+N",
        role: "new",
        click() {
          dialog
            .showSaveDialog({
              title: "新建文件",
              filters: [
                { name: "数据库", extensions: ["bd"] },
                { name: "All Files", extensions: ["*"] },
              ],
            })
            .then((filename: any) => {
              // dialog.showSaveDialog是一个promise，关于promise可以查看https://www.liaoxuefeng.com/wiki/1022910821149312/1023024413276544
              // 向renderer发送newdb消息
              if (filename.filePath) {
                win?.webContents.send("newdb", filename.filePath);
              }
            });
        },
      },
      {
        label: "修改密码",
        async click() {
          // 向renderer发送changedb消息
          if (win) {
            win.webContents.send("changeDb", null);
          }
        },
      },
      {
        label: "退出",
        role: "quit",
        click() {
          app.quit(); //退出程序
        },
      },
    ],
  },
  {
    label: "编辑",
    submenu: [
      {
        label: "复制",
        accelerator: "CmdOrCtrl+C",
        role: "copy",
      },
      {
        label: "粘贴",
        accelerator: "CmdOrCtrl+V",
        role: "paste",
      },
    ],
  },
  {
    label: "帮助",
    role: "help",
    submenu: [
      {
        label: "学习更多",
        click: async () => {
          const { shell } = require("electron"); //引入shell模块
          await shell.openExternal("https://rkroom.com"); //跳转到网站
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
async function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 563,
    title: 'Main window',
    icon: join(ROOT_PATH.public, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  require('@electron/remote/main').enable(win.webContents)
  if (app.isPackaged) {
    win.loadFile(indexHtml)
  } else {
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

ipcMain.handle('getPasswd', IpcPasswd)
ipcMain.handle('newdb', mainNewDb)
ipcMain.handle('getFileName', openFile)
ipcMain.handle('save-file', saveFile);

app.whenReady().then(() => {

  createWindow()

})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
    },
  })

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg })
  } else {
    childWindow.loadURL(`${url}/#${arg}`)
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
})

async function mainNewDb(event: any, message: any) {
  changeConfig({ dbpath: message.dbfile, password: null })
  let dbInfo = await initializeDb(message.dbfile, message.password)
  win?.close()
  createWindow()
  return dbInfo
}


async function IpcPasswd() {
  return getPasswd()
}

async function saveFile(event, { buffer, filename }: { buffer: Buffer, filename: string }) {
    // 打开保存对话框
    const { filePath } = await dialog.showSaveDialog({
      title: '保存文件',
      defaultPath: filename,
    });
    
    if (filePath) {
      // 使用 fs-extra 写入文件，writeFile 返回 Promise
      await fsExtra.writeFile(filePath, buffer);
      return true;
    } else {
      throw new Error('用户取消保存');
    }
}

ipcMain.on('quitApp', (_event, _message) => {
  app.quit()
})

ipcMain.on('changePasswdConfig', (_event, message) => {
  changePasswdConfig(message.isSave, message.password)
})

ipcMain.on('reloadWin', (_event, _message) => {
  win?.close()
  createWindow()
})

async function openFile() {
  const fileName = await dialog.showOpenDialog({
    //打开文件对话框
    title: "打开文件",
    filters: [
      //文件过滤器
      { name: "账单文件", extensions: ["xlsx", "xls"] },
      { name: "All Files", extensions: ["*"] },
    ],
  })
  return fileName.filePaths
}