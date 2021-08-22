import fse from "fs-extra"; // 读取配置文件
import electron from "electron";

//配置文件路径
const configFile = electron.remote.getGlobal('shareObject').configFile

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
function changePasswdConfig(isSave: boolean, password: string): void {
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

function dateFtt(fmt: string, date: Date): string {
  const o: any = {
    "M+": date.getMonth() + 1,
    "d+": date.getDate(),
    "h+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
    "q+": Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds(),
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (const k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
}

function currentlyMonthDays(): Array<string> {
  // 获取当前月份，由此计算本月收支
  const date = new Date();
  const year = date.getFullYear();
  let month: any = date.getMonth() + 1;
  if (month.toString().length === 1) {
    month = "0" + month;
  }
  const d = new Date(year, month, 0);
  return [
    year + "-" + month + "-" + "01 00:00:00",
    year + "-" + month + "-" + d.getDate() + " 23:59:59",
  ];
}

function previousMonthDays(): Array<string> {
  // 获取上月月份，由此计算上月收支
  const date = new Date();
  let year = date.getFullYear();
  let month: any = date.getMonth();
  if (month === 0) {
    year = year - 1;
    month = 12;
  }
  if (month.toString().length === 1) {
    month = "0" + month;
  }
  const d = new Date(year, month, 0);
  return [
    year + "-" + month + "-" + "01 00:00:00",
    year + "-" + month + "-" + d.getDate() + " 23:59:59",
  ];
}

export {
  getPasswd,
  changePasswdConfig,
  dateFtt,
  currentlyMonthDays,
  previousMonthDays,
};
