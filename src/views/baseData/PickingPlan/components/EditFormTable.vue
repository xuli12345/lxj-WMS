<template>
  <div>
    <div class="btns">
      <div class="flex">
        <el-button
          v-if="addItem"
          type="primary"
          size="mini"
          class="iconfont icon-xinzeng add"
          @click="addPopRight"
          >新增</el-button
        >
        <el-button
          type="primary"
          class="iconfont icon-baocun"
          @click="submitForm()"
          size="mini"
          >保存</el-button
        >

        <el-button class="iconfont icon-quxiao" size="mini" @click="resetForm()"
          >取消</el-button
        >
        <div class="flex" style="margin-left:10px">
          <el-button
            type="primary"
            class="el-icon-bottom"
            @click="downloadTemp"
            size="mini"
            >下载模板</el-button
          >
          <el-upload
            style="margin-left:10px;float:right"
            ref="upload"
            class="upload"
            action
            :on-change="handleChange"
            :on-remove="handleRemove"
            :auto-upload="false"
            :show-file-list="false"
            accept="application/vnd.openxmlformats-    
        officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          >
            <el-button type="primary" class="iconfont icon-excel" size="mini"
              >导入excel</el-button
            >
          </el-upload>
        </div>
      </div>
    </div>
    <!-- 头部表单 -->
    <child-form-head
      :fTableViewHead="fTableViewHead[0]"
      :rowData="rowData"
      ref="ruleForm"
    ></child-form-head>
    <!-- 表格 -->
    <child-table
      ref="childTable"
      :fTableView="fTableViewItem"
      :insertData="insertData"
      :fID="rowData.fID"
      :selectArr="selectArr2"
      :rowData="rowData"
    ></child-table>
    <!-- 新增字表数据 -->
    <el-drawer
      :append-to-body="true"
      :visible.sync="drawer"
      direction="rtl"
      :before-close="handleClose"
      v-if="addItem"
    >
      <child-form-head
        @closeBox="closeItemBox"
        :fTableViewHead="fTableViewItem[0]"
        ref="ItemRuleForm"
        :addItem="addItem"
        :selectArr="selectArr2"
      ></child-form-head>
    </el-drawer>
  </div>
</template>

<script>
import { timeCycle, updateTime } from "@/utils/updateTime"; //格式化时间
import { compare, handelData } from "@/utils/common";
import { tempUrl } from "@/utils/tempUrl";
import {
  getTableHeadData,
  collectionData,
  getTableBodyData,
  imPortExcel
} from "@/api/index";
import { decryptDesCbc } from "@/utils/cryptoJs.js";
import ChildFormHead from "./EditChildFormHead";
import ChildTable from "./EditChildTable";

export default {
  props: [
    "fTableViewHead",
    "fTableViewItem",
    "addItem",
    "selectArr2",
    "rowData",
    "strType"
  ],
  components: {
    ChildFormHead,
    ChildTable
  },
  data() {
    return {
      drawer: false,
      //表格添加的数据
      insertData: {},
      //从表回显所有的数据
      allBackData: [],
      userDes: JSON.parse(sessionStorage.getItem("user")).userDes
    };
  },
  methods: {
    //保存
    submitForm() {
      let formHeadData = this.$refs.ruleForm.tableHead; //表单头部数据
      let childTableData = this.$refs.childTable.tableHeadData; //从表表头数据
      let formData = this.$refs.ruleForm.ruleForm; //表单的数据
      let tableData = this.$refs.childTable.tableData; //表格的数据
      let backData = this.$refs.childTable.backData; //表格原来的数据
      let wantData = handelData(backData, tableData); //处理数据，获取修改的，新增的，删除的数据
      let updateArr = wantData[0];
      let insertArr = wantData[1];
      let deletedArr = wantData[2];
      this.$refs.ruleForm.$refs.ruleForm.validate(async valid => {
        if (valid) {
          let res = await collectionData([
            {
              TableName: this.fTableViewHead[0],
              updateData: [formData],
              headData: formHeadData
            },
            {
              TableName: this.fTableViewItem[0],
              updateData: updateArr,
              insertData: insertArr,
              deleteData: deletedArr,
              headData: childTableData
            }
          ]);

          res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

          if (res.State === true) {
            this.$message.success("修改成功!");
            this.$emit("closeBox", JSON.parse(JSON.stringify(formData)));
            this.$refs.ruleForm.$refs.ruleForm.resetFields();
          } else {
            this.$message.error(res.Message);
          }
        }
      });
    },
    //取消
    resetForm() {
      this.$refs.ruleForm.$refs.ruleForm.resetFields();
      this.$emit("closeBox");
    },
    //新增按钮
    addPopRight() {
      this.drawer = true;
    },
    //点击x关闭弹窗
    handleClose(done) {
      this.drawer = false;
    },
    //获取从表所有的数据
    async getItemBackData() {
      let where = [
        { Computer: "=", DataFile: "fMstID", Value: this.rowData.fID }
      ];
      let res = await getTableBodyData("v_PickingPlan_Item", where);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        this.allBackData = JSON.parse(res.Data);
        // console.log(this.allBackData);
      }
    },
    //关闭字表新增弹窗
    closeItemBox(value) {
      if (value) {
        console.log(value, "lieiee");
        if (this.allBackData.length == 0) {
          value.fPickingID = value.fStorageCode;
          this.insertData = value;
        } else {
          let res = this.allBackData.some(item => {
            return value.fProductID == item.fProductID;
          });
          if (
            //称重方案 库位50-01-01-01-01可以设置同样的库位
            res != true &&
            this.rowData.fID == 3 &&
            value.fStorageCode == 30595
          ) {
            value.fPickingID = value.fStorageCode;
            this.insertData = value;
          } else if (
            //默认拣货方案 可以设置同样的库位
            //库位21-01-01-01-01
            //60-01-01-01-01:30599
            // 71-01-01-01-01:30600
            // 72-01-01-01-01:30601
            res != true &&
            this.rowData.fID == 5 &&
            (value.fStorageCode == 30593 ||
              value.fStorageCode == 30599 ||
              value.fStorageCode == 30600 ||
              value.fStorageCode == 30601)
          ) {
            value.fPickingID = value.fStorageCode;
            this.insertData = value;
          } else {
            let res2 = this.allBackData.some(item => {
              return value.fStorageCode == item.fPickingID;
            });
            if (res == true || res2 == true) {
              this.$message.warning("此货品已存在或此货位已存在!");
            } else {
              value.fPickingID = value.fStorageCode;
              this.insertData = value;
            }
          }
        }
      }
      this.drawer = false;
    },
    // excel导入
    handleChange(file, fileList) {
      this.fileTemp = file.raw;
      if (this.fileTemp) {
        if (
          this.fileTemp.type ==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          this.fileTemp.type == "application/vnd.ms-excel"
        ) {
          this.importFile(this.strType, this.fileTemp);
        } else {
          this.$message({
            type: "warning",
            message: "附件格式错误，请删除后重新上传！"
          });
        }
      } else {
        this.$message({
          type: "warning",
          message: "请上传附件！"
        });
      }
    },

    handleRemove(file, fileList) {
      this.fileTemp = null;
    },
    //下载模板
    downloadTemp() {
      // if (this.strType.includes("Goods")) {
      // window.location.href = `${tempUrl}/ImportTempModFile/货品导入模板.xlsx`;
      //}
    },

    async importFile(strType, file) {
      let res = await imPortExcel({
        strType: strType,
        file: file
      });
      console.log(res, "导入");
      if (res.state) {
        this.$message.success("导入成功!");
        this.getItemBackData();
      } else {
        this.$message.error(res.message);
      }
    }
  },
  created() {
    this.getItemBackData();
  }
};
</script>

<style></style>
