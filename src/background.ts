"use strict";

import { app, protocol, BrowserWindow, Menu, ipcMain, dialog } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import initializeDb from "@/utils/db";
import path from "path";
import fse from "fs-extra";

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

// 配置文件路径，app.getPath：https://electronjs.org/docs/api/app
// 路径为C:\Users\用户名\AppData\Roaming\Electron
const configFile:string = path.join(app.getPath("userData"), process.env.NODE_ENV === "development"?"devConfig.json":"config.json");

(<any>global).shareObject = {
  configFile:configFile
}

// 配置文件默认值
let config = {
  dbpath: ":memory:",
  name: "account book",
  version: "0.0.1",
  password: null,
};
function changeConfig(filename: string) {
  // 如果配置文件存在
  if (fse.existsSync(configFile)) {
    // 读取配置文件并且转换为JSON对象
    config = JSON.parse(fse.readFileSync(configFile, "utf-8"));
    // 修改数据库文件路径
    config.dbpath = filename;
    // 重新写入配置
    fse.writeFileSync(configFile, JSON.stringify(config));
  } else {
    // 确保配置文件存在
    fse.ensureFileSync(configFile);
    // 修改数据库路径
    config.dbpath = filename;
    // 重新写入配置文件
    fse.writeFileSync(configFile, JSON.stringify(config));
  }
}

let mainWindow: any;

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 563,
    webPreferences: {
      enableRemoteModule: true,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    mainWindow.loadURL("app://./index.html");
  }
}

// 监听newdb
ipcMain.on("newdb", (event, message) => {
  // 修改配置文件
  changeConfig(message.dbfile);
  // 初始化数据库
  initializeDb(message.dbfile, message.password);
  // 重启窗口
  mainWindow.close();
  createWindow();
});

const template = [
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
              // filePaths为一个数组
              changeConfig(filename.filePaths[0]);
              // 重启窗口
              mainWindow.reload();
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
            .then((filename) => {
              // dialog.showSaveDialog是一个promise，关于promise可以查看https://www.liaoxuefeng.com/wiki/1022910821149312/1023024413276544
              // 向renderer发送newdb消息
              mainWindow.webContents.send("newdb", filename.filePath);
            });
        },
      },
      {
        label: "修改密码",
        async click() {
          // 向renderer发送changedb消息
          mainWindow.webContents.send("changedb", null);
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

//@ts-ignore
const menu = Menu.buildFromTemplate(template); //设置菜单模板
Menu.setApplicationMenu(menu); //设置菜单

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

function createConfig() {
  if (!fse.existsSync(configFile)) {
    fse.ensureFileSync(configFile);
    fse.writeFileSync(configFile, JSON.stringify(config));
  }
}

createConfig();

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
