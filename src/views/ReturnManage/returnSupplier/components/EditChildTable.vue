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
            >
              {{ scope.row[item.fColumn] }}</template
            >

            <el-input
              @change="changePri(scope.row, item.fColumn)"
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
              :disabled="isDisabled"
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
import { compare } from "@/utils/common";
import { getTableHeadData, getTableBodyData } from "@/api/index";
export default {
  props: ["fTableView", "insertData", "fID", "changeData", "isDisabled"],
  data() {
    return {
      getRowKeys(row) {
        return row.fID;
      },
      tableData: [],
      tableHeadData: [],
      backData: [],
      selectWeight: [],
      selData: [],
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
          DataFile: this.fTableView[1],
          Value: this.fID
        }
      ];
      let res = await getTableBodyData(this.fTableViewll, searchWhereObj);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        this.tableData = JSON.parse(res.Data);
        //原来的数据
        // this.tableData = this.tableData.sort(compare)
        this.tableData.forEach(element => {
          if (element.fProdDate) {
            element.fProdDate = updateTime(element.fProdDate);
          }
          if (element.fExpireDate) {
            element.fExpireDate = updateTime(element.fExpireDate);
          }
        });

        this.backData = JSON.parse(JSON.stringify(this.tableData));
        console.log(this.backData, "回显的数据");
        this.total = this.tableData.length;
      } else {
        this.$message.error(res.Message);
      }
    },

    handleDelete(val, index) {
      this.tableData.splice(index, 1);
    },
    changePri(item, val) {
      // console.log(item, val, 111);
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
    insertData(n, o) {
      this.insertData.forEach(ele => {
        ele[this.fTableView[1]] = this.fID;
      });
      let iL = this.insertData.length;
      let tL = this.tableData.length;

      for (let i = 0; i < iL; i++) {
        for (let j = 0; j < tL; j++) {
          if (
            this.insertData[i].fProductID == this.tableData[j].fProductID &&
            this.insertData[i].fProductCode == this.tableData[j].fProductCode &&
            this.insertData[i].fBatchNo == this.tableData[j].fBatchNo
          ) {
            this.$message.error("请勿添加相同货品!");
            return;
          }
        }
      }
      this.tableData = this.tableData.concat(
        JSON.parse(JSON.stringify(this.insertData))
      );
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
