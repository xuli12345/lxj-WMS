<template>
  <div>
    <el-table
      :header-cell-style="{ background: '#eef1f6' }"
      :data="tableData | pagination(pageNum, pageSize)"
      v-fit-columns
      class="table-wrapper"
      ref="singleTable"
      :max-height="tableHeight"
      border
      :row-key="getRowKeys"
      style="width: 100%;"
    >
     
      <el-table-column type="index" width="50"></el-table-column>
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
            <template
              v-if="
                item.fColumn == 'fProductCode' ||
                  item.fColumn == 'fProductName' ||
                  item.fColumn == 'fUnitName' ||
                  item.fColumn == 'fBatchNo' ||
                  item.fColumn == 'fProdDate' ||
                  item.fColumn == 'fExpireDate' ||
                  item.fColumn == 'fRtnAmount'
              "
              >{{ scope.row[item.fColumn] }}</template
            >
            <el-input
              @change="changePri(scope.row, item.fColumn)"
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
  </div>
</template>
<script>
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { timeCycle, updateTime } from "@/utils/updateTime"; //格式化时间
import { addParams, batchDelete, compare } from "@/utils/common";
import { getTableHeadData } from "@/api/index";
export default {
  props: [
    "fTableView",
    "tableName",
    "isSaveSuccess",
    "value",
    "isSave",
    "selBatchList",
    "tableData"
  ],
  data() {
    return {
      getRowKeys(row) {
        return row.fCompanyID || row.fModName;
      },
      tableHeadData: [],
      BatchList: [],
      OrignData: [],
      //权限表修改的数据
      editTableData: [],
      fTableViewData: "",
      select: true,
      fTableViewll: "",
      pageNum: 1,
      pageSize: 10,
      total: 0,
      tableHeight: document.body.clientHeight,
      userDes: this.$store.state.user.userInfo.userDes,
      userId: this.$store.state.user.userInfo.userId,
      sqlConn: sessionStorage.getItem("sqlConn")
    };
  },
  methods: {
    // 页容量
    handleSizeChange(val) {
      this.pageSize = val;
    },
    // 当前页
    handleCurrentChange(val) {
      this.pageNum = val;
    },
    changeA(item, val) {
      if (this.isAuthority) {
        this.editTableData.push(item);
        this.editTableData = Array.from(new Set(this.editTableData));
        this.$emit("update:selBatchList", this.editTableData);
      }

      if (item[val] == 0) {
        this.$set(item, val, 1);
      } else if (item[val] == 1) {
        this.$set(item, val, 0);
      }
    },

    //获取表格表头数据
    async getTableHeadData() {
      let res = await getTableHeadData(this.fTableView);
      let userDes = JSON.parse(sessionStorage.getItem("user")).userDes;
      res = JSON.parse(decryptDesCbc(res, String(userDes)));

      if (res.State) {
        this.fTableViewll = res.fTableViewData;
        this.tableHeadData = res.lstRet.sort(compare);
        console.log(this.tableHeadData, "字表表头数据");
      } else {
        this.$message.error(res.Message);
      }
    },

    handleDelete(val, index) {
      this.tableData.splice(index, 1);
    },
    changePri(item, val) {
      if (val == "fPrice" || val == "fQty") {
        this.$set(
          item,
          "fRtnAmount",
          (parseFloat(item.fPrice || 0) * parseFloat(item.fQty || 0)).toFixed(2)
        );
      }
    }
  },
  watch: {
    tableData: {
      handler() {
        this.tableData.forEach(ele => {
          if (ele.fProdDate) {
            ele.fProdDate = updateTime(ele.fProdDate);
          } else {
            ele.fProdDate = null;
          }
          if (ele.fExpireDate) {
            ele.fExpireDate = updateTime(ele.fExpireDate);
          } else {
            ele.fExpireDate = null;
          }
        });
        this.total = this.tableData.length;
      },
      immediate: true
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
