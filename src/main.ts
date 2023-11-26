import { createApp } from 'vue'
import App from './App.vue'
import router from "./router";

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import EventBus from './tools/event';

import * as Icons from '@element-plus/icons-vue'

import { isValidKey } from './tools/tools';

const app = createApp(App)

for (let i in Icons) {
  if (isValidKey(i, Icons)) {
    app.component(i, Icons[i])
  }
}
app
  .use(ElementPlus, {
    locale: zhCn,
  })
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })



const $bus = new EventBus();
app.provide("$bus", $bus);
app.config.globalProperties.$bus = $bus;

