import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import installElementPlus from "./plugins/element";
import EventBus from "@/utils/event";

const app = createApp(App);

installElementPlus(app);
app.use(store).use(router).mount("#app");
const $bus = new EventBus();
app.provide("$bus", $bus);
app.config.globalProperties.$bus = $bus;
