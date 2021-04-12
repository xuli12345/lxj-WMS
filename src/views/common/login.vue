<template>
  <div class="site-wrapper">
    <img
      :style="{ width: width + 'px' }"
      src="../../assets/img/bg-lxj.jpg"
      alt
    />

    <p class="title">
      <!-- <img
        style="width:50px;height:50px;margin-left:-60px"
        src="../../assets/img/logo.jpg"
        alt
      /> -->
      欢迎进入老乡鸡仓储管理系统平台
    </p>
    <p class="tit">power by 知行易通信息科技有限公司</p>

    <div class="login-main" ref="loginMain">
      <h3 class="login-title">管理员登录</h3>
      <el-form
        :model="dataForm"
        :rules="dataRule"
        ref="dataForm"
        @keyup.enter.native="submitForm('dataForm')"
        status-icon
      >
        <el-form-item>
          <el-select v-model="value" placeholder="请选择仓库" class="select">
            <el-option
              v-for="(item, index) in options"
              :key="index"
              :label="item.fCompanyName"
              :value="item.fCompanyName"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="username">
          <el-input
            v-model="dataForm.username"
            placeholder="帐号"
            ref="codeInput"
          >
            <i
              slot="suffix"
              class="el-input__icon el-icon-s-grid"
              @click="clickCode"
            ></i>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="dataForm.password"
            type="password"
            placeholder="密码"
            @focus="inputFocus"
          >
            <i
              slot="suffix"
              class="el-input__icon el-icon-s-grid"
              @click="inputPassword"
            ></i>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            class="login-btn-submit"
            type="primary"
            :disabled="isDisabled"
            @click="submitForm('dataForm')"
            >登录</el-button
          >
        </el-form-item>
        <el-form-item>
          <el-button
            class="login-btn-submit"
            type="primary"
            :disabled="isDisabled"
            @click="pickForm('dataForm')"
            >称重分拣登录</el-button
          >
        </el-form-item>
      </el-form>
    </div>
    <keyboard
      ref="keyboard"
      :keyShow="keyShow"
      @sendText="keyDown"
      @enterFinish="enterFinish"
    ></keyboard>
  </div>
</template>

<script>
//导入请求的api
import { userLogin, login, getCompanyData } from "@/api/user";
import { companyList, getUserLimitMenu, menus } from "@/api/index.js";
import { decryptDesCbc } from "@/utils/cryptoJs.js";
import keyboard from "@/views/keyboard/keyboard";
import axios from "axios";
import md5 from "js-md5";
export default {
  components: {
    keyboard
  },
  name: "login",
  data() {
    return {
      //图片宽度
      width: document.body.clientWidth,
      isDisabled: false,
      options: [],
      value: "",
      dataForm: {
        username: "",
        password: ""
      },
      dataRule: {
        username: [
          { required: true, message: "帐号不能为空", trigger: "blur" }
        ],
        password: [{ required: true, message: "密码不能为空", trigger: "blur" }]
      },
      fCompanyId: -1,
      keyShow: false,
      // 状态，判断当前的输入是账号还是密码
      // true为输入账号
      // false为输入密码
      inputStyle: true
    };
  },

  methods: {
    keyDown(v) {
      // console.log("2", v);
      if (this.inputStyle) {
        return (this.dataForm.username = v);
      }
      return (this.dataForm.password = v);
    },
    // 键盘输入完成
    enterFinish(v) {
      this.keyShow = false;
    },
    submitForm(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          this.isDisabled = true;

          let res = await login({
            CustomerID: 1,
            Usercode: this.dataForm.username,
            Password: md5(this.dataForm.password)
          });

          if (res.state) {
            let user = {
              username: res.userName,
              userId: res.userID,
              usercode: res.userCode,
              userDes: decryptDesCbc(res.desCode, "d#s87@28se45&i(p")
            };
            window.localStorage.setItem("token", res.token);
            window.sessionStorage.setItem("user", JSON.stringify(user));
            this.$store.commit("user/updataUser", user);
            this.$message.success("登录成功!");
            let userId = res.userID;
            let userDes = decryptDesCbc(res.desCode, "d#s87@28se45&i(p");
            //用户权限
            let fSqlConn = 1;
            this.options.forEach((item, index) => {
              if (this.value == item.fCompanyName) {
                fSqlConn = item.fSqlConn;
              }
            });
            let res1 = await getUserLimitMenu(
              [this.fCompanyId, userId],
              fSqlConn
            );
            res1 = JSON.parse(decryptDesCbc(res1, String(userDes)));
            // console.log(res1)
            // console.log(res1.Data,"权限")
            sessionStorage.setItem("userLimit", res1.Data);
            this.$router.replace({ name: "home" });
            this.$store.commit("common/updatePickState", false);
            let user2 = this.$store.state.user.userInfo;
            let res3 = await menus(user2);
            res3 = JSON.parse(decryptDesCbc(res3, String(user.userDes)));
            if (res3.State) {
              this.$store.commit("common/updateMenuList", res3.Menuurl.Child);
            }
          } else {
            this.isDisabled = false;
            this.$message.warning(res.message);
          }
        } else {
          this.$message.error("登录失败!");
          return false;
        }
      });
    },
    pickForm(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          this.isDisabled = true;
          let res = await login({
            CustomerID: 1,
            Usercode: this.dataForm.username,
            Password: md5(this.dataForm.password)
          });

          if (res.state) {
            let user = {
              username: res.userName,
              userId: res.userID,
              usercode: res.userCode,
              userDes: decryptDesCbc(res.desCode, "d#s87@28se45&i(p")
            };
            window.localStorage.setItem("token", res.token);
            window.sessionStorage.setItem("user", JSON.stringify(user));
            this.$store.commit("user/updataUser", user);
            this.$message.success("登录成功!");
            let userId = res.userID;
            let userDes = decryptDesCbc(res.desCode, "d#s87@28se45&i(p");
            //用户权限
            let fSqlConn = 1;
            this.options.forEach((item, index) => {
              if (this.value == item.fCompanyName) {
                fSqlConn = item.fSqlConn;
              }
            });
            let res1 = await getUserLimitMenu(
              [this.fCompanyId, userId],
              fSqlConn
            );
            res1 = JSON.parse(decryptDesCbc(res1, String(userDes)));

            sessionStorage.setItem("userLimit", res1.Data);
            this.$router.replace({
              name: "InvoiceManage/WeighingSorting/WeighingSorting"
            });
            this.$store.commit("common/updateStaffNo", this.dataForm.username);
            this.$store.commit("common/updatePickState", true);
            // this.$router.push({path:'/InvoiceManage/WeighingSorting/WeighingSorting'})
            let user2 = this.$store.state.user.userInfo;
            let res3 = await menus(user2);
            res3 = JSON.parse(decryptDesCbc(res3, String(user.userDes)));
            if (res3.State) {
              this.$store.commit("common/updateMenuList", res3.Menuurl.Child);
            }
          } else {
            this.isDisabled = false;
            this.$message.warning(res.message);
          }
        } else {
          this.$message.error("登录失败!");
          return false;
        }
      });
    },
    clickCode() {
      this.keyShow = true;
      this.inputStyle = true;
    },
    inputFocus() {
      this.$refs.keyboard.resetData();
      this.inputStyle = false;
    },
    inputPassword() {
      this.$refs.keyboard.resetData();
      this.keyShow = true;
      this.inputStyle = false;
    }
  },
  watch: {
    value(newVal, oldVal) {
      this.options.forEach((item, index) => {
        if (newVal == item.fCompanyName) {
          sessionStorage.setItem("sqlConn", JSON.stringify(item.fSqlConn));
          sessionStorage.setItem("requestUrl", item.fServiceUrl);
          sessionStorage.setItem("fCompanyId", item.fID);
          this.fCompanyId = item.fID;
        }
      });
    }
  },

  async created() {
    let res = await companyList();
    if (res.state) {
      let resCom = res.lstRet;
      this.options = resCom;
      this.value = resCom[0].fCompanyName;
      sessionStorage.setItem("sqlConn", JSON.stringify(resCom[0].fSqlConn));
      sessionStorage.setItem("requestUrl", resCom[0].fServiceUrl);
      this.fCompanyId = resCom[0].fID;
    }
  }
};
</script>

<style lang="scss" scoped>
.site-wrapper {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  img {
    position: absolute;
    height: 100%;
  }
  .title {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    font-weight: 700;
    color: #66b1ff;
    // font-size: 40px;
    // margin: 200px 0 0 160px;
    font-size: 2.2vw;
    margin: 20vh 0 0 10vw;
  }
  .tit {
    position: absolute;
    right: 50px;
    bottom: 20px;
    font-weight: 700;
    color: #333;
  }
}

.login-main {
  z-index: 3;
  position: absolute;
  width: 100%;
  transform: translate(35%, 65%);
  .login-title {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    line-height: 60px;
    margin-left: 10px;
  }
  .select {
    width: 100%;
  }
}
.login-btn-submit {
  width: 100%;
  margin-top: 20px;
  margin-left: 10px;
}
.el-form-item {
  width: 400px;

  margin-bottom: 20px !important;
}
/deep/ .el-input__inner {
  height: 40px !important;
}
</style>

