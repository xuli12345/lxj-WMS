import Vue from "vue";
import App from "./App";
import router from "./router";
import "babel-polyfill";
import "./assets/css/index.scss";
import "./assets/css/icon/iconfont.css";
import store from "@/store/store";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
Vue.use(ElementUI);
import XLSX from "xlsx";
Vue.use(XLSX);


import Plugin from 'v-fit-columns';
Vue.use(Plugin)

import numberKeyboard from "@/views/keyboard/";
Vue.use(numberKeyboard);


import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'

Vue.use(Viewer, {
  defaultOptions: {
    zIndex: 9999
  }
})






Viewer.setDefaults({
  Options: { 
    "inline": true, // 是否启动inline模式
    "button": true, // 是否显示右上角关闭按钮
    "navbar":false, // 是否显示缩略图导航
    "title": false, // 是否显示当前图片的标题
    "toolbar": false,  // 是否显示工具栏
    "tooltip": true, // 是否显示缩放百分比
    "movable": true, // 图片是否可移动
    "zoomable": true, // 图片是否可缩放
    "rotatable": true, // 图片是否可旋转
    "scalable": true, // 图片是翻转
    "transition": true, // 是否使用css3过渡
    "fullscreen": true, // 播放时是否全屏
    "keyboard": true, // 是否支持键盘
    "url": "data-source" // 设置大图片的url
  }
});

// 避免路由重复点击时报错或npm i vue-router@3.0 -S
import Router from "vue-router";
const routerPush = Router.prototype.push;
Router.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(error => error);
};

Vue.filter("pagination", function(tableData, pageNum, pageSize) {
  // console.log(tableData)
  //当前页第一条的索引
  let offset = (pageNum - 1) * pageSize;
  let data =
    offset + pageSize >= tableData.length
      ? tableData.slice(offset, tableData.length)
      : tableData.slice(offset, offset + pageSize);
  return data;
});

// console.log(router.options.routes)

Vue.config.productionTip = false;


new Vue({
  el: "#app",
  router,
  store,
  components: {
    App
  },
  template: "<App/>"
});
