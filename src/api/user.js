//引入axios网络请求库
import http from "@/http/http";
/**
 *
 *   封装获取用户登录
 *
 */

function login(obj) {
  console.log(JSON.stringify(obj));
  return http({
    url: "http://47.99.147.173:8001/token/userLogin",
    //url: "http://8.129.208.95:8012/token/userLogin", //测试
    method: "POST",
    data: JSON.stringify(obj)
  });
}

export { login };
