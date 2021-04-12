<template>
  <el-dialog title="修改密码" :visible.sync="visible" :append-to-body="true">
    <el-form
      :model="dataForm"
      :rules="dataRule"
      ref="dataForm"
      @keyup.enter.native="dataFormSubmit()"
      label-width="80px"
    >
      <el-form-item label="账号">
        <span>{{ dataForm.username }}</span>
      </el-form-item>
      <el-form-item label="原密码" prop="password">
        <el-input type="password" v-model="dataForm.password"></el-input>
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input type="password" v-model="dataForm.newPassword"></el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input type="password" v-model="dataForm.confirmPassword"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button size="mini" @click="visible = false">
        <i class="iconfont icon-quxiao"></i>取消</el-button
      >
      <el-button size="mini" type="primary" @click="dataFormSubmit()">
        <i class="iconfont icon-baocun"></i>确定</el-button
      >
    </span>
  </el-dialog>
</template>

<script>
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { clearLoginInfo } from "@/utils";
import {
  addformSaveData,
  getTableBodyData,
  getTableHeadData,
  collectionData
} from "@/api/index";
import md5 from "js-md5";
export default {
  data() {
    var validateConfirmPassword = (rule, value, callback) => {
      if (this.dataForm.newPassword !== value) {
        callback(new Error("确认密码与新密码不一致"));
      } else {
        callback();
      }
    };
    return {
      userDes: JSON.parse(sessionStorage.getItem("user")).userDes,
      tableHeadData: [],
      userObj: {},
      visible: false,
      dataForm: {
        username: "",
        password: "",
        newPassword: "",
        confirmPassword: ""
      },
      dataRule: {
        password: [
          { required: true, message: "原密码不能为空", trigger: "blur" }
        ],
        newPassword: [
          { required: true, message: "新密码不能为空", trigger: "blur" }
        ],
        confirmPassword: [
          { required: true, message: "确认密码不能为空", trigger: "blur" },
          { validator: validateConfirmPassword, trigger: "blur" }
        ]
      }
    };
  },
  computed: {
    // userName: {
    //   get () { return this.$store.state.user.name }
    // },
    mainTabs: {
      get() {
        return this.$store.state.common.mainTabs;
      },
      set(val) {
        this.$store.commit("common/updateMainTabs", val);
      }
    }
  },
  methods: {
    // 初始化
    init() {
      this.visible = true;
      this.getTableHeadData();
      this.getUserMsg();
      this.$nextTick(() => {
        this.$refs["dataForm"].resetFields();
      });
    },
    // 表单提交
    dataFormSubmit() {
      this.$refs["dataForm"].validate(async valid => {
        this.$set(this.userObj, "fPassWord", md5(this.dataForm.newPassword));
        if (valid) {
          let res = await collectionData([
            {
              headData: this.tableHeadData,
              updateData: [this.userObj],
              TableName: "t_User_Mst"
            }
          ]);
          res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
          if (res.State) {
            this.$message.success("修改成功!");
            this.visible = false;
          } else {
            this.$message.error(res.Message);
          }
        }
      });
    },
    //获取表头信息
    async getTableHeadData() {
      let res = await getTableHeadData("t_user_mst");
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        this.tableHeadData = res.lstRet;
        console.log(this.tableHeadData, "表头的字段");
      }
    },
    async getUserMsg() {
      let userInfo = JSON.parse(sessionStorage.getItem("user"));
      this.dataForm.username = userInfo.username;
      let searchWhere = [
        {
          Computer: "=",
          DataFile: "fUserName",
          Value: userInfo.username
        }
      ];

      let res = await getTableBodyData("v_user_mst", searchWhere);
      res = JSON.parse(decryptDesCbc(res, String(userInfo.userDes)));
      // console.log(res);
      if (res.State) {
        let result = JSON.parse(res.Data);
        this.userObj = result[0];
        this.dataForm.password = result[0].fPassWord;
      }
    }
  }
  // created() {
  //   this.getTableHeadData();
  //   this.getUserMsg();
  // }
};
</script>
<style lang="scss" scoped>
/deep/ .el-dialog {
  width: 40%;
}
.el-form-item {
  width: 50%;
}
</style>
