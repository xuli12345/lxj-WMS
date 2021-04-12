<template>
  <div>
    <div class="page flex-wrap">
      <div
        class="search-title flex-align-center"
        v-for="(item, index) in searchData"
        :key="index"
      >
        {{ item.fColumnDes }}:

        <el-checkbox
          v-if="item.fDataType == 'bit'"
          v-model="asData[item.fColumn]"
        ></el-checkbox>
        <el-date-picker
          v-else-if="item.fDataType == 'datetime'"
          v-model.trim="asData[item.fColumn]"
          type="date"
          placeholder="选择日期时间"
          min-width="300"
        ></el-date-picker>
        <el-row v-else-if="item.fComputer == 'between'">
          <el-col :span="11">
            <el-input
              v-model.trim="startData[item.fColumn]"
              placeholder="请输入范围值"
            ></el-input>
          </el-col>
          <el-col :span="2">——</el-col>
          <el-col :span="11">
            <el-input
              style="margin-left:0px"
              v-model.trim="endData[item.fColumn]"
              placeholder="请输入范围值"
            ></el-input>
          </el-col>
        </el-row>
        <el-input
          v-else
          v-model.trim="asData[item.fColumn]"
          :placeholder="`请输入${item.fColumnDes}`"
        ></el-input>
      </div>
      <div style="margin-top:10px">
        <el-button
          type="primary"
          size="mini"
          class="iconfont icon-A"
          @click="search"
          >查询</el-button
        >

        <el-button
          type="primary"
          size="mini"
          @click="setMaxStock"
          class="iconfont icon-setting"
          >批量设置最高库存</el-button
        >
        <el-button
          type="primary"
          size="mini"
          @click="setMinStock"
          class="iconfont icon-setting"
          >批量设置最低库存</el-button
        >
        <el-button
          type="primary"
          size="mini"
          class="iconfont icon-export"
          :disabled="userLimit('fExport')"
          @click="handerExport"
          >导出</el-button
        >
      </div>
    </div>
    <el-table
      :header-cell-style="{ background: '#eef1f6' }"
      v-fit-columns
      :data="tableData"
      class="table-wrapper"
      ref="singleTable"
      :max-height="tableHeight"
      border
      :row-key="getRowKeys"
      @selection-change="handleSelectionChange"
      style="width: 100%;"
    >
  
      <el-table-column type="selection" width="50"></el-table-column>
      <el-table-column type="index" label="序号" width="50"></el-table-column>
      <template v-for="(item, index) in tableHeadData">
        <el-table-column
          v-if="item.fVisible == 1 ? true : false"
          :key="index"
          :label="item.fColumnDes"
          :prop="item.fColumn"
          sortable
          min-width="120px"
        >
          <template slot-scope="scope">
            <el-checkbox
              @change="changeA(scope.row, item.fColumn)"
              v-if="item.fDataType == 'bit'"
              :value="scope.row[item.fColumn] == 0 ? false : true"
            ></el-checkbox>

            <el-input
              v-else
              v-model="scope.row[item.fColumn]"
              :maxlength="scope.row[item.fLength]"
            ></el-input>
          </template>
        </el-table-column>
      </template>
      <el-table-column fixed="right" label="操作" align="center" width="120">
        <template slot-scope="scope">
          <div class="operation">
            <el-button
              type="text"
              size="small"
              @click.stop="handleDelete(scope.row, scope.$index)"
              >删除</el-button
            >

            <el-button
              type="text"
              size="small"
              @click="handleEdit(scope.row, scope.$index)"
              >修改</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <div class="page flex-justify-end">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pageNum"
        :page-sizes="[10, 50, 100, 400]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </div>
    <!-- dailog -->
    <el-dialog
      :title="title"
      append-to-body
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose"
    >
      <el-input v-model="inputValue" placeholder="请输入内容"></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="dialogVisible = false">取 消</el-button>
        <el-button size="mini" type="primary" @click="confirm()"
          >确 定</el-button
        >
      </span>
    </el-dialog>
    <!--修改  -->
    <el-drawer
      :modal="false"
      :visible.sync="drawerValue"
      :direction="'rtl'"
      :before-close="handleEditClose"
      v-if="isDestory"
    >
      <edit-form-table
        @closeBox="closeEditBox"
        :fTableViewHead="fTableView[0]"
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
import { compare, batchDelete, userLimit } from "@/utils/common";
import EditFormTable from "./EditChildFormHead";
import {
  getTableHeadData,
  getTableBodyData,
  collectionData,
  exportData
} from "@/api/index";

export default {
  props: ["fTableView", "insertData", "fID", "selectArr", "rowData"],
  components: {
    EditFormTable
  },
  data() {
    return {
      tableHeight: document.body.clientHeight,
      tableHeadData: [], //表头数据
      //获取表格内容TableView的值,在获取headData中获取
      getRowKeys(row) {
        // console.log(row)
        return row.fSort || row.fID;
      },
      //表格数据
      tableData: [],
      // 当前页数
      pageNum: 1,
      // 每页条数
      pageSize: 10,
      // 总条数
      total: 0,
      userDes: this.$store.state.user.userInfo.userDes,
      //获取表格数据的fTableView
      fTableViewll: "",
      backData: [],
      selData: [],
      asData: {},
      startData: {},
      endData: {},
      searchData: [],
      searchWhere: [],
      BatchList: [],
      dialogVisible: false,
      isDestory: false,
      inputValue: "",
      title: "",
      drawerValue: false,
      editForm: {}
    };
  },
  methods: {
    // 页容量
    handleSizeChange(val) {
      this.pageSize = val;
      this.getTableData();
    },
    // 当前页
    handleCurrentChange(val) {
      this.pageNum = val;
      this.getTableData();
    },
    // 手动选中Checkbox
    handleSelectionChange(val) {
      this.BatchList = val;
    },
    handleEdit(row, index) {
      this.drawerValue = true;
      this.editForm = row;
    },
    //点击x关闭弹窗
    handleEditClose(done) {
      this.drawerValue = false;
    },
    async getItemTableData(where) {
      let res = await getTableBodyData(
        this.fTableViewll,
        where,
        1,
        this.pageSize
      );
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        let result = JSON.parse(res.Data);
        return result;
      } else {
        this.$message.error(res.Message);
      }
    },
    //关闭修改弹窗
    async closeEditBox(val) {
      if (val) {
        console.log(val, this.rowData);
        val.fPickingID = val.fStorageCode;
        let where = [
          {
            Computer: "=",
            DataFile: this.fTableView[1],
            Value: this.fID
          },
          {
            Computer: "=",
            DataFile: "fPickingID",
            Value: val.fStorageCode
          }
        ];
        let searchWhere = [
          {
            Computer: "=",
            DataFile: this.fTableView[1],
            Value: this.fID
          },
          {
            Computer: "=",
            DataFile: "fProductID",
            Value: val.fProductID
          }
        ];
        let PickingIDTableData = await this.getItemTableData(where);
        let productIDTableData = await this.getItemTableData(searchWhere);
        console.log(PickingIDTableData, productIDTableData);
        if (PickingIDTableData.length == 1 && productIDTableData.length == 1) {
          console.log(1.0);
          if (
            PickingIDTableData[0].fID == val.fID &&
            productIDTableData[0].fID == val.fID
          ) {
            // console.log(1.1);
            this.tableData.forEach((item, index) => {
              if (val.fID == item.fID) {
                this.tableData.splice(index, 1);
                this.tableData.push(val);
              }
            });
            this.$message.success("新增成功!");
          } else {
            this.$message.warning("此货品已存在或此货位已存在!");
          }
        } else if (
          PickingIDTableData.length == 0 &&
          productIDTableData.length == 0
        ) {
          console.log(2.0);
          this.tableData.forEach((item, index) => {
            if (val.fID == item.fID) {
              console.log(2.1);
              this.tableData.splice(index, 1);
              this.tableData.push(val);
            }
          });
          this.$message.success("新增成功!");
        } else if (
          PickingIDTableData.length == 0 &&
          productIDTableData.length == 1
        ) {
          console.log(3.0);
          if (productIDTableData[0].fID == val.fID) {
            console.log(3.1);
            this.tableData.forEach((item, index) => {
              if (val.fID == item.fID) {
                this.tableData.splice(index, 1);
                this.tableData.push(val);
              }
            });
            this.$message.success("新增成功!");
          } else {
            this.$message.warning("此货品已存在或此货位已存在!");
          }
        } else if (
          PickingIDTableData.length == 1 &&
          productIDTableData.length == 0
        ) {
          console.log(4.0);
          if (PickingIDTableData[0].fID == val.fID) {
            console.log(4.1);
            this.tableData.forEach((item, index) => {
              if (val.fID == item.fID) {
                this.tableData.splice(index, 1);
                this.tableData.push(val);
              }
            });
            this.$message.success("新增成功!");
          } else {
            this.$message.warning("此货品已存在或此货位已存在!");
          }
        } else {
          console.log(5.0);
        }
      }
      this.drawerValue = false;
    },
    //查询
    search() {
      this.pageNum=1
      this.getTableData();
    },
    changeA(item, val) {
      if (item[val] == 0) {
        item[val] = 1;
        this.$set(item, val, 1);
      } else if (item[val] == 1) {
        item[val] = 0;
        this.$set(item, val, 0);
      }
    },

    //获取表格表头数据
    async getTableHeadData() {
      let res = await getTableHeadData(this.fTableView[0]);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

      if (res.State) {
        this.fTableViewll = res.fTableViewData;
        this.tableHeadData = res.lstRet.sort(compare);
        // console.log(this.tableHeadData, "字表表头");
        let searchArr = [];
        searchArr = this.tableHeadData.filter(element => {
          return element.fQureyCol == 1;
        });
        let ColumnArr = [];
        searchArr.forEach(item => {
          ColumnArr.push(item.fColumn);
        });
        // console.log(ColumnArr, "搜索的字段");
        let arr = [];
        ColumnArr.forEach((element, index) => {
          this.tableHeadData.forEach((item, index) => {
            // if (item.fColumn.includes(element)) {
            //这里用相等 当勾选的字段名相近时就会把没勾选的值给添加进来
            if (item.fColumn == element) {
              let obj = {
                fColumnDes: item.fColumnDes,
                fColumn: item.fColumn,
                fComputer: item.fComputer,
                fDataType: item.fDataType
              };
              arr.push(obj);
            }
          });
        });
        this.searchData = arr;
        this.getTableData();
      } else {
        this.$message.error(res.Message);
      }
    },
    //获取表格内容数据
    async getTableData() {
      this.searchCommon();
      // console.log(searchWhereObj, "searchWhereObj");
      let res = await getTableBodyData(
        this.fTableViewll,
        this.searchWhere,
        this.pageNum,
        this.pageSize
      );
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

      if (res.State) {
        this.tableData = JSON.parse(res.Data);
        this.tableData = this.tableData.sort(compare);
        this.tableData.forEach((element, index) => {
          this.$set(element, "fSort", index + 1);
          for (const key in element) {
            if (
              (key.indexOf("Date") != -1 ||
                key.indexOf("time") != -1 ||
                key.indexOf("LifeDays") != -1) &&
              element[key] != null
            ) {
              element[key] = element[key].replace(/T/, " ");
            }
          }
        });

        this.backData = JSON.parse(JSON.stringify(this.tableData));
        console.log(this.backData, "回显的数据");
      } else {
        this.$message.error(res.Message);
      }
      this.total = res.TTLPage;
    },

    handleDelete(val, index) {
      this.tableData.splice(index, 1);
    },
    handleClose(done) {
      this.dialogVisible = false;
    },
    //根据用户权限，查询按钮是否禁用
    userLimit(val) {
      let a = userLimit(val);
      return a;
    },
    async confirm() {
      if (this.title == "最高库存设置") {
        this.BatchList.forEach(item => {
          this.$set(item, "fMaxStockNum", this.inputValue);
        });
      }
      if (this.title == "最低库存设置") {
        this.BatchList.forEach(item => {
          this.$set(item, "fMinStockNum", this.inputValue);
        });
      }
      let res = await collectionData([
        {
          headData: this.tableHeadData,
          updateData: this.BatchList,
          TableName: this.fTableView[0]
        }
      ]);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        this.$message.success("设置成功");
        this.dialogVisible = false;
        this.inputValue = "";
        this.getTableData();
      }
    },
    //批量设置最高库存
    async setMaxStock() {
      if (this.BatchList.length == 0) {
        this.$message.warning("请选择数据!");
      } else {
        this.dialogVisible = true;
        this.title = "最高库存设置";
      }
    },
    //批量设置最低库存
    setMinStock() {
      if (this.BatchList.length == 0) {
        this.$message.warning("请选择数据!");
      } else {
        this.dialogVisible = true;
        this.title = "最低库存设置";
      }
    },
    //EXCEL导出
    async handerExport() {
      this.searchCommon();
      let res = await exportData(
        this.fTableViewll,
        this.searchWhere,
        this.fTableView[0]
      );

      if (!res) return;
      var blob = new Blob([res], {
        type: "application/vnd.ms-excel;charset=utf-8"
        //  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
      });
      var downloadElement = document.createElement("a");
      var href = window.URL.createObjectURL(blob); //创建下载的链接

      downloadElement.href = href;
      downloadElement.download = `${this.$route.meta.title}-详情.xlsx`; //下载后文件名
      document.body.appendChild(downloadElement);
      downloadElement.click(); //点击下载
      document.body.removeChild(downloadElement); //下载完成移除元素
      window.URL.revokeObjectURL(href); //释放掉blob
      // this.searchWhere = [
      //   { Computer: "=", DataFile: this.fTableView[1], Value: this.fID }
      // ];
    },
    searchCommon() {
      this.searchWhere = [
        {
          Computer: "=",
          DataFile: this.fTableView[1],
          Value: this.fID
        }
      ];
      if (JSON.stringify(this.asData) == "{}") {
      } else {
        this.searchData.forEach(element => {
          if (this.asData[element.fColumn]) {
            let result = this.asData[element.fColumn];
            if (result instanceof Date) {
              result = timeCycle(result);
              // console.log(result);
            }
            if (result.constructor == Boolean && result == true) {
              result = 1;
            }
            let obj = {
              Computer: element.fComputer,
              DataFile: element.fColumn,
              Value: result
            };
            this.searchWhere.push(obj);
          }
        });
      }
      let startobj = {};
      let endobj = {};
      let arr = [];
      for (const key in this.startData) {
        for (const Ikey in this.endData) {
          // console.log(this.startData[key],this.startData[key]!="")
          if (
            Ikey == key &&
            this.startData[key] != null &&
            this.endData[key] != null
          ) {
            startobj = {
              Computer: ">=",
              DataFile: key,
              Value: this.startData[key]
            };
            endobj = {
              Computer: "<=",
              DataFile: key,
              Value: this.endData[Ikey]
            };

            arr.push(startobj);
            arr.push(endobj);
          } else {
            startobj = {};
            endobj = {};
          }
        }
      }

      if (arr.length >= 1) {
        this.searchWhere.push(...arr);
      }
    }
  },
  watch: {
    insertData(n, o) {
      this.insertData[this.fTableView[1]] = this.fID;
      this.tableData = this.tableData.concat(
        JSON.parse(JSON.stringify(this.insertData))
      );
      this.total = this.tableData.length;
    },
    drawerValue: function(val, old) {
      // console.log(val)
      if (val) {
        this.isDestory = true;
      } else {
        setTimeout(() => {
          this.isDestory = false;
        }, 500);
      }
    }
  },

  created() {
    this.getTableHeadData();
  }
};
</script>
<style lang="scss" scoped>
.table-wrapper .el-input {
  margin-left: 0;
}
.table-wrapper /deep/.el-input__inner {
  border: none !important;
}
</style>
