<template>
  <div>
    <HomeTable
      :fTableView="fTableView"
      :tableName="'t_Vehicle_Insurance_Mst'"
      :isSaveSuccess="isSaveSuccess"
      @openDrawer="openDrawer"
      @openEditDrawer="openEditDrawer"
      :batchDelTableName="batchDelTableName"
      :isItem="true"
    ></HomeTable>
    <el-drawer
      :modal-append-to-body="false"
      :visible.sync="drawer"
      :direction="direction"
      :before-close="handleClose"
      v-if="newisDestory"
    >
      <FormTable
        @closeBox="closeBox"
        :fTableViewHead="fTableViewHead"
        :fTableViewItem="fTableViewItem"
        :addItem="true"
        :selectArr="selectArr"
      ></FormTable>
    </el-drawer>
    <el-drawer
      :modal-append-to-body="false"
      :visible.sync="drawerValue"
      :direction="direction"
      :before-close="handleEditClose"
      v-if="isDestory"
    >
      <edit-form-table
        @closeBox="closeEditBox"
        :fTableViewHead="fTableViewHead"
        :fTableViewItem="fTableViewItem"
        :addItem="true"
        :selectArr="selectArr"
        :rowData="editForm"     
      ></edit-form-table>
    </el-drawer>
  </div>
</template>
<script>
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { timeCycle } from "@/utils/updateTime"; //格式化时间
import HomeTable from "@/components/HomeTable";
import FormTable from "../components/FormTable";
import EditFormTable from "../components/EditFormTable";
export default {
  components: {
    FormTable,
    HomeTable,
    EditFormTable
  },
  data() {
    return {
      drawer: false,
      drawerValue: false,
      direction: "rtl",
      //新增销毁创建
      newisDestory: false,
      //修改销毁创建
      isDestory: false,
      //表格列头数据
      tableHeadData: [],
      //表格内容
      tableData: [],
      //当前行的数据
      editForm: {},
      fTableView: "t_Vehicle_Insurance_Mst",

      //是否新增成功
      isSaveSuccess: false,
      //批量删除的数据
      batchDelTableName: [
        {
          Key: "t_InboundOrder_Item",
          Value: [{ Key: "fID", Value: "fMstID" }]
        }
      ],
      //表头的字段，以及自增长字段
      fTableViewHead: ["t_Vehicle_Insurance_Mst", "fID"],
      //表格的ftableview,自增长字段
      fTableViewItem: ["t_Vehicle_Insurance_Item", "fMstID"],
      //表单需要下拉选择的数据
      //fName 需要做下拉的字段，fUrl 下拉选择的数据的接口，
      //fDes 下拉选择的label值 ,fID选择绑定的值
      //fAuto 需要自动带出的值
      //fAutoID 需要转换使用fID的值
      //fEdit  需要转换使用的当前页面显示的字段名
      //searchWhere 根据单位类型查询相对应的数据
      selectArr: [
        {
          fName: "fLicenseNo",
          fUrl: "v_Vehcile_Driver",
          fDes: "fLicenseNo",
          fID: "fID",
          // fEdit: [{ key: "fMstStateName", value: "TypeName" }],
          fAuto: ["fVehicleID"],
          fAutoID: ["fVehicleID"]
        }
      ],

     
    };
  },
  watch: {
    drawerValue: function(val, old) {
      // console.log(val)
      if (val) {
        this.isDestory = true;
      } else {
        setTimeout(() => {
          this.isDestory = false;
        }, 500);
      }
    },
    drawer: function(val, old) {
      // console.log(val)
      if (val) {
        this.newisDestory = true;
      } else {
        setTimeout(() => {
          this.newisDestory = false;
        }, 500);
      }
    }
  },
  methods: {
    //新增
    openDrawer(headData) {
      this.tableHeadData = headData;
      this.drawer = true;
      this.isSaveSuccess = false;
    },
    //双击修改弹框
    openEditDrawer(row, headData) {
      this.tableHeadData = headData;
      this.editForm = row;
      this.drawerValue = true;
      this.isSaveSuccess = false;
    },

    //点击x关闭弹窗
    handleClose(done) {
      this.drawer = false;
    },
    //点击x关闭弹窗
    handleEditClose(done) {
      this.drawerValue = false;
    },
    //关闭修改弹窗
    closeEditBox(val) {
      if (val) {
        this.isSaveSuccess = true;
      }
      this.drawerValue = false;
    },
    //关闭新增弹窗
    closeBox(value) {
      if (value) {
        this.isSaveSuccess = true;
      }
      this.drawer = false;
    }
  }
};
</script>
<style lang="scss" scoped></style>
