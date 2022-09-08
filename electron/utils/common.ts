import fse from "fs-extra"; // 读取配置文件

//配置文件路径
import { configFile, appConfig } from "./config";

//文件编码
const charEncoding = "utf-8";

//获取密码
function getPasswd(): string {
  const password = JSON.parse(fse.readFileSync(configFile, charEncoding))[
    "password"
  ];
  return password;
}

// 修改密码设置
function changePasswdConfig(isSave: boolean, password: string | null): void {
  if (isSave === true) {
    // 如果需要记住密码，则将密码写入配置文件
    const config = JSON.parse(fse.readFileSync(configFile, charEncoding));
    config["password"] = password;
    fse.writeFileSync(configFile, JSON.stringify(config));
  } else {
    // 如果不需要记住密码，则将密码设置为null
    const config = JSON.parse(fse.readFileSync(configFile, charEncoding));
    config["password"] = null;
    fse.writeFileSync(configFile, JSON.stringify(config));
  }
}


function changeConfig(newConfig: any) {
  let config = appConfig
  // 如果配置文件存在
  if (fse.existsSync(configFile)) {
    // 读取配置文件并且转换为JSON对象
    config = JSON.parse(fse.readFileSync(configFile, "utf-8"));
    // 修改数据库文件路径
    for (let i in newConfig) {
      config[i] = newConfig[i]
    }
    // 重新写入配置
    fse.writeFileSync(configFile, JSON.stringify(config));
  } else {
    // 确保配置文件存在
    fse.ensureFileSync(configFile);
    // 修改数据库路径
    for (let i in newConfig) {
      config[i] = newConfig[i]
    }
    // 重新写入配置文件
    fse.writeFileSync(configFile, JSON.stringify(config));
  }
}

function isValidKey(key: string | number | symbol, object: object): key is keyof typeof object {
  return key in object
}

export {
  getPasswd,
  changePasswdConfig,
  changeConfig,
  isValidKey,
};