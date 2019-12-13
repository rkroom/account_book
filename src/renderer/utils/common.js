import path from 'path' // 引入path拼接路径
import fse from 'fs-extra' // 读取配置文件

//配置文件路径
const configFile = path.join(require('electron').remote.app.getPath('userData'), 'config.json')

//获取密码
function getPasswd () {
  let password = JSON.parse(fse.readFileSync(configFile))['password']
  return password
}

// 修改密码设置
function changePasswdConfig (isSave, password) {
  if (isSave === true) {
    // 如果需要记住密码，则将密码写入配置文件
    let config = JSON.parse(fse.readFileSync(configFile))
    config['password'] = password
    fse.writeFileSync(configFile, JSON.stringify(config))
  } else {
    // 如果不需要记住密码，则将密码设置为null
    let config = JSON.parse(fse.readFileSync(configFile))
    config['password'] = null
    fse.writeFileSync(configFile, JSON.stringify(config))
  }
}

function dateFtt (fmt, date) {
  var o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S': date.getMilliseconds()
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  }
  return fmt
}


export { getPasswd, changePasswdConfig, dateFtt }
