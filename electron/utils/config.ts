import { app } from 'electron'
import path from 'path';
import fse from "fs-extra";
import pkg from '../../package.json'
// 配置文件路径，app.getPath：https://electronjs.org/docs/api/app
// 路径为C:\Users\用户名\AppData\Roaming\Electron
// vite下import.meta.env.DEV为开发环境变量
const configFile: string = path.join(
  app.getPath("userData"),
  process.env.NODE_ENV === "development" || import.meta.env.DEV ? "devConfig.json" : "config.json"
);

let appConfig:any = {
  dbpath: ":memory:",
  name: "account book",
  version: pkg.version,
  password: null,
};

function checkConfigFile() {
  if (fse.existsSync(configFile)) {
  } else {
    fse.writeFileSync(configFile, JSON.stringify(appConfig));
  }
}

checkConfigFile()

export { configFile, appConfig }