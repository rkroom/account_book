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

export { getPasswd, changePasswdConfig }
