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
          v-model.trim="asData[item.fColumn]"
        ></el-checkbox>
        <el-date-picker
          v-else-if="item.fDataType == 'datetime'"
          v-model="asData[item.fColumn]"
          type="datetime"
          placeholder="选择日期时间"
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

        <template
          v-else-if="fColumn.length > 0 && fColumn.includes(item.fColumn)"
        >
          <el-select
            v-model="cargData[item.fColumn]"
            @change="getName(cargData[item.fColumn], item.fColumn)"
          >
            <el-option
              v-for="i in sData(item.fColumn)"
              :label="i.fColumnDes"
              :key="i.ID"
              :value="i.fColumnDes"
            >
            </el-option>
          </el-select>
        </template>
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
          :disabled="userLimit('fQurey')"
          >查询</el-button
        >
        <el-button
          type="primary"
          size="mini"
          class="iconfont icon-dayin1"
          @click="printCon()"
          :disabled="userLimit('fPrint')"
          >打印</el-button
        >
        <!-- <el-button
          type="primary"
          size="mini"
          class="iconfont icon-yishenhe"
          @click="handleCheck"
          >修改</el-button
        > -->

        <!-- <el-button
          type="primary"
          size="mini"
          class="iconfont icon-shanchu"
          @click="BatchDelete"
          :disabled="userLimit('fDel')"
          >批量删除</el-button
        > -->
      </div>
    </div>
    <el-table
      :header-cell-style="{ background: '#eef1f6' }"
       v-fit-columns
      class="table-wrapper"
      ref="singleTable"
      :max-height="tableHeight"
      border
      style="width: 100%"
      :row-key="getRowKeys"
      :data="tableData | pagination(pageNum, pageSize)"
      @selection-change="handleSelectionChange"
      @row-dblclick="dblclick"
    >
      <el-table-column type="selection" width="50"></el-table-column>
      <el-table-column type="index" label="序号" width="50"></el-table-column>
      <template>
        <template v-for="(item, index) in tableHeadData">
          <el-table-column
            v-if="item.fVisible == 1"
            :key="index"
            :label="item.fColumnDes"
            :prop="item.fColumn"
            min-width="160px"
            sortable
            :column-key="item.fColumn"
          >
          </el-table-column>
        </template>
      </template>
      <el-table-column fixed="right" label="操作" align="center" width="120">
        <template slot-scope="scope">
          <div class="operation">
            <el-button
              type="text"
              size="small"
              @click.stop="handleDelete(scope.row, scope.$index)"
              :disabled="userLimit('fDel')"
              >删除</el-button
            >
            <el-button
              type="text"
              size="small"
              @click="handleEdit(scope.row, scope.$index)"
              :disabled="userLimit('fEdit')"
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
    <!-- 打印格式内容   -->
    <div style="width:0; height:0;overflow:hidden">
      <PrintTable
        v-if="isRender"
        ref="print"
        id="toPrint"
        :dataCode="dataCode"
      ></PrintTable>
    </div>
  </div>
</template>
<script>
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { timeCycle } from "@/utils/updateTime"; //格式化时间
import { userLimit, compare, addParams, batchDelete } from "@/utils/common";
import { chunk } from "@/utils/index";
import PrintJS from "print-js";
import PrintTable from "./PrintStorage";
import {
  getTableBodyData,
  getTableHeadData,
  deleteStorageItem,
  collectionData
} from "@/api/index";

export default {
  props: ["fTableView", "tableName", "isSaveSuccess", "selData", "fColumn"],
  components: {
    PrintTable
  },
  data() {
    return {
      getRowKeys(row) {
        return row.fID;
      },
      inputValue: "",
      //是否临时库位
      fIsTemporaryStorage: false,
      searchData: [],
      tableHeadData: [],
      fTableViewData: "",
      BatchList: [],
      tableData: [],
      pageNum: 1,
      pageSize: 10,
      total: 0,
      asData: {},
      endData: {},
      startData: {},
      dataCode: [],
      isRender: false,
      cargData: {},
      tableHeight: document.body.clientHeight,
      userDes: this.$store.state.user.userInfo.userDes,
      userId: this.$store.state.user.userInfo.userId,
      sqlConn: sessionStorage.getItem("sqlConn")
    };
  },
  methods: {
    sData(v) {
      let arr = [];
      this.selData.forEach(element => {
        if (element.name == v) {
          arr = element.data;
        }
      });
      return arr;
    },
    getName(data, i) {
      let arr = this.sData(i);
    },
    //批量删除
    // BatchDelete() {
    //   if (this.BatchList.length == 0) {
    //     this.$message.warning("请选择要删除的数据!");
    //   } else {
    //     let result = batchDelete(this.tableHeadData, this.BatchList);
    //     this.$confirm("此操作将永久删除该数据, 是否继续?", "提示", {
    //       confirmButtonText: "确定",
    //       cancelButtonText: "取消",
    //       type: "warning"
    //     })
    //       .then(async () => {
    //         let res = await addformSaveData([
    //           {
    //             lstSaveData: [
    //               {
    //                 TableName: this.tableName,
    //                 IdentityColumn: null,
    //                 InsertRow: null,
    //                 UpdateRow: null,
    //                 DeleteRow: result.arr,
    //                 Columns: result.columns
    //               }
    //             ]
    //           },
    //           { userDes: this.userDes, userId: this.userId }
    //         ]);
    //         res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

    //         if (res.State) {
    //           this.$message.success("删除成功!");
    //           this.getTableData();
    //         } else {
    //           this.$message.error(res.errstr);
    //         }
    //       })
    //       .catch(() => {
    //         this.$message({
    //           type: "info",
    //           message: "已取消删除"
    //         });
    //       });
    //   }
    // },
    async printCon() {
      console.log(this.cargData);
      if (
        JSON.stringify(this.startData) == "{}" ||
        JSON.stringify(this.endData) == "{}" ||
        this.startData.fStorageCode == "" ||
        this.endData.fStorageCode == ""
      ) {
        this.$message.warning("请在库位编码中筛选要打印的库位标签!");
      } else if (this.tableData.length <= 0) {
        this.$message.warning("请点击查询按钮查询要打印的标签数据!");
      } else if (JSON.stringify(this.cargData) == "{}") {
        this.$message.warning("请选择您要打印的货层类型!");
      } else {
        //处理数组对象 排序相同的属性
        this.tableData.sort((a, b) => {
          if (a["fStorageBarCode"] != b["fStorageBarCode"]) {
            return a["fStorageBarCode"].localeCompare(b["fStorageBarCode"]);
          }
        });

        //分割数组
        let arrData = [];
        if (this.cargData.fCargory == "奇数层货架") {
          arrData = chunk(this.tableData, 6);
        } else if (this.cargData.fCargory == "偶数层货架") {
          arrData = chunk(this.tableData, 8);
        }

        //处理最后一位数的排序
        arrData.forEach(v => {
          v.forEach(i => {
            let lastNum = i.fStorageBarCode.substr(-2, 2);
            this.$set(i, "lastNum", lastNum);
            v.sort(this.compare("lastNum"));
          });
        });
        //组装要循环的数据
        let tableList = [];
        let leftArr = [];
        let rightArr = [];
        let allData = [];

        arrData.forEach(item => {
          let result = this.comfun(item, 8);
          if (result.a.length == 2) {
            let result1 = this.comfun(result.left, 8);
            leftArr = [...result.a, ...result1.a];
            let result2 = this.comfun(result1.left, 8);
            rightArr = [...result2.a, ...result2.left];
            allData = [leftArr, rightArr];
          } else if (result.a.length != 2) {
            allData = [result.a, result.left];
          }
          tableList.push(allData);
        });
        this.dataCode = tableList;
        // console.log(this.dataCode);
        this.common();
      }
    },
    common() {
      this.isRender = true;
      setTimeout(() => {
        PrintJS({
          printable: "toPrint",
          type: "html",
          scanStyles: false,
          css: [
            // "@/assets/iconfont/iconfont.css",
            // "https://unpkg.com/element-ui/lib/theme-chalk/index.css"
          ]
        });
      }, 300);
      setTimeout(() => {
        this.isRender = false;
      }, 400);
    },
    //对数组进行筛选
    comfun(arr, num) {
      let a = [];
      arr.forEach((item, index) => {
        let str = item.fStorageBarCode.substr(0, num);
        a = arr.filter(val => {
          return val.fStorageBarCode.includes(str);
        });
      });
      let copy = JSON.parse(JSON.stringify(arr));
      let left = copy.filter(
        item => !a.some(ele => ele.fStorageBarCode === item.fStorageBarCode)
      );
      return {
        a,
        left
      };
    },
    //给定指定的数据排序(由高到低)
    compare(prop) {
      return function(a, b) {
        var value1 = a[prop];
        var value2 = b[prop];
        return value2 - value1;
      };
    },

    //用户表格列头
    async getTableHeadData() {
      let res = await getTableHeadData(this.fTableView);

      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        this.fTableViewData = res.fTableViewData;
        this.tableHeadData = res.lstRet.sort(compare);

        let newArr = [];
        newArr = this.tableHeadData.filter(element => {
          return element.fKey == 1;
        });
        let obj = {};
        newArr.forEach(item => {
          obj = {
            ColumnName: item.fColumn,
            ColumnType: item.fDataType
          };
        });
        let searchArr = [];
        searchArr = this.tableHeadData.filter(element => {
          return element.fQureyCol == 1;
        });

        let ColumnArr = [];
        searchArr.forEach(item => {
          ColumnArr.push(item.fColumn);
        });
        let arr = [];
        ColumnArr.forEach((element, index) => {
          this.tableHeadData.forEach((item, index) => {
            if (item.fColumn.includes(element)) {
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

        let add = {
          fColumn: "fCargory",
          fColumnDes: "货层类型",
          fComputer: "=",
          fDataType: "int"
        };
        arr.push(add);
        this.searchData = arr;
      } else {
        this.$message.error(res.Message);
      }
    },
    //查询
    search() {
      this.getTableData();
    },
    //获取table表格内容数据
    async getTableData() {
      this.pageNum = 1;
      this.searchWhere = [];
      if (JSON.stringify(this.asData) == "{}") {
        this.searchWhere = [];
      } else {
        this.searchData.forEach(element => {
          if (this.asData[element.fColumn]) {
            let result = this.asData[element.fColumn];

            if (result instanceof Date) {
              result = timeCycle(result);
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
      let where = {};
      let arr = [];
      for (const key in this.startData) {
        for (const Ikey in this.endData) {
          if (Ikey == key) {
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
          }
          if (this.startData[key] == "" && this.endData[Ikey] == "") {
            arr = [];
          }
        }
      }

      if (arr.length >= 1) {
        this.searchWhere.push(...arr);
      }
      let res = await getTableBodyData(this.fTableViewData, this.searchWhere);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

      if (res.State) {
        this.tableData = JSON.parse(res.Data);
        this.total = this.tableData.length;

        this.tableData.forEach(element => {
          for (const key in element) {
            if (key === "fIsTemporaryStorage" && element[key] == null) {
              this.$set(element, "fIsTemporaryStorage", 0);
            }
          }
        });
        console.log(this.tableData, "表体内容");
      }
    },

    //双击表格弹框
    dblclick(row) {
      console.log(row);
      if (this.userLimit("fEdit") == false) {
        this.$emit("openEditDrawer", row, this.tableHeadData);
      }
    },
    //修改
    handleEdit(row, index) {
      console.log(row);
      this.$emit("openEditDrawer", row, this.tableHeadData);
    },
    // 删除
    handleDelete(row, index) {
      // console.log(row,11)
      let RowData = JSON.parse(JSON.stringify(row));
      let resultData = addParams(this.tableHeadData, row);
      this.$confirm("此操作将永久删除该文件, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          let res = await deleteStorageItem([
            {
              lstSaveData: [
                {
                  TableName: this.tableName,
                  IdentityColumn: "fID",
                  InsertRow: null,
                  UpdateRow: null,
                  DeleteRow: [resultData.arr],
                  Columns: resultData.columns
                }
              ]
            },
            { userDes: this.userDes, userId: this.userId }
          ]);

          res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
          if (res.State) {
            this.$message.success("删除成功!");
            this.getTableData();
          } else {
            this.$message.error(res.Message);
          }
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },

    // 手动选中Checkbox
    handleSelectionChange(val) {
      this.BatchList = val;
    },

    // 页容量
    handleSizeChange(val) {
      this.pageSize = val;
    },
    // 当前页
    handleCurrentChange(val) {
      this.pageNum = val;
    },

    //根据用户权限，查询按钮是否禁用
    userLimit(val) {
      return userLimit(val);
    },

    async handleCheck() {
      this.tableData.forEach(item => {
        // this.$set(item, "fStorageType", 3);
        this.$set(item, "fAreaID", 31);
      });
      let res = await collectionData([
        {
          TableName: this.tableName,
          headData: this.tableHeadData,
          updateData: this.tableData
        }
      ]);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      console.log(res);
    }
  },
  watch: {
    isSaveSuccess(newVal, oldVal) {
      if (newVal) {
        this.getTableData();
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
.demo {
  display: flex;
}
</style>
