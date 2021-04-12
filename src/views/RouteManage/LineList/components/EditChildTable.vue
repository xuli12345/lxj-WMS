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
            <el-checkbox
              @change="changeA(scope.row, item.fColumn)"
              v-if="item.fDataType == 'bit'"
              :value="scope.row[item.fColumn] == 0 ? false : true"
              :disabled="isDisabled"
            ></el-checkbox>

            <el-date-picker
              v-else-if="item.fDataType == 'datetime'"
              v-model="scope.row[item.fColumn]"
              type="datetime"
              placeholder="选择日期时间"
              :disabled="isDisabled"
            ></el-date-picker>

            <el-input
              v-else
              v-model="scope.row[item.fColumn]"
              :maxlength="scope.row[item.fLength]"
              :disabled="isDisabled"
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
              :disabled="scope.row.fItemID == fID"
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
import { compare } from "@/utils/common";
import { getTableHeadData, getTableBodyData } from "@/api/index";
export default {
  props: ["fTableView", "insertData", "fID", "isDisabled"],
  data() {
    return {
      getRowKeys(row) {
        return row.fID;
      },
      tableHeadData: [],
      backData: [],
      selData: [],
      tableData: [],
      pageNum: 1,
      pageSize: 10,
      total: 0,
      fTableViewll: "",
      tableHeight: document.body.clientHeight,
      userDes: this.$store.state.user.userInfo.userDes
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
      if (item[val] == 0) {
        this.$set(item, val, 1);
      } else if (item[val] == 1) {
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

        this.getTableData();
      } else {
        this.$message.error(res.Message);
      }
    },
    //获取表格内容数据
    async getTableData() {
      let searchWhereObj = [
        {
          Computer: "=",
          DataFile: "fMstID",
          Value: this.fID
        }
      ];

      let res = await getTableBodyData("v_Heliu_Item", searchWhereObj);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

      if (res.State) {
        this.tableData = JSON.parse(res.Data);
        this.backData = JSON.parse(JSON.stringify(this.tableData));
        this.total = this.tableData.length;
        console.log(this.backData, "回显的数据");
      } else {
        this.$message.error(res.Message);
      }
    },

    handleDelete(val, index) {
      this.tableData.splice(index, 1);
    }
  },

  watch: {
    insertData(n, o) {
      this.insertData[this.fTableView[1]] = this.fID;
      this.tableData = this.tableData.concat(
        JSON.parse(JSON.stringify(this.insertData))
      );
      // let hash = {};
      // const data2 = this.tableData.reduce((preVal, curVal) => {
      //   hash[curVal.fID]
      //     ? ""
      //     : (hash[curVal.fID] = true && preVal.push(curVal));
      //   return preVal;
      // }, []);
      // this.tableData = data2;
      this.total = this.tableData.length;
    }
  },

  async created() {
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
