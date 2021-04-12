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
              :disabled="item.fReadOnly == 0 ? false : true"
            ></el-checkbox>

            <el-input
              v-else-if="item.fColumn === 'fSort'"
              v-model="scope.row[item.fColumn]"
              @change="ruleContent(scope.row[item.fColumn])"
              :disabled="item.fReadOnly == 0 ? false : true"
            ></el-input>
            <el-input
              v-else
              v-model="scope.row[item.fColumn]"
              :maxlength="scope.row[item.fLength]"
              :disabled="item.fReadOnly == 0 ? false : true"
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
import { getTableHeadData, getTableBodyData } from "@/api/index";
import { decryptDesCbc } from "@/utils/cryptoJs.js";
import { compare } from "@/utils/common";

export default {
  props: {
    apiUrl: {
      type: String,
      default: () => ""
    },
    IdentityColumn: {
      type: String,
      default: () => ""
    },
    fID: {
      type: Number,
      default: () => -1
    }
  },
  data() {
    return {
      tableHeadData: [],
      OriginTableData: [],
      tableData: [],
      pageNum: 1,
      pageSize: 10,
      total: 0,
      fTableViewData: "",
      tableHeight: document.body.clientHeight,
      userDes: JSON.parse(sessionStorage.getItem("user")).userDes
    };
  },
  methods: {
    //   获取表格头部
    async getTableHead() {
      let res = await getTableHeadData(this.apiUrl);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

      if (res.State) {
        this.tableHeadData = res.lstRet.sort(compare);
        this.fTableViewData = res.fTableViewData;
      } else {
        this.$message.error(res.Message);
      }
    },
    async getTableBodyData() {
      let searchWhere = [
        {
          Computer: "=",
          DataFile: this.IdentityColumn,
          Value: this.fID
        }
      ];
      let res = await getTableBodyData(this.fTableViewData, searchWhere);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        this.tableData = JSON.parse(res.Data);
        this.tableData.forEach(element => {
          for (const key in element) {
            if (
              (key.indexOf("Date") != -1 || key.indexOf("time") != -1) &&
              element[key] != null
            ) {
              element[key] = element[key].replace(/T/, " ");
            }
          }
        });
        this.total = this.tableData.length;
        this.OriginTableData = JSON.parse(JSON.stringify(this.tableData));
      }
    },

    // 页容量
    handleSizeChange(val) {
      this.pageSize = val;
    },
    // 当前页
    handleCurrentChange(val) {
      this.pageNum = val;
    },
    handleDelete(val, index) {
      this.tableData.splice(index, 1);
    },
    changeA(item, val) {
      if (item[val] == 0) {
        item[val] = 1;
      } else if (item[val] == 1) {
        item[val] = 0;
      }
    },
    //验证表格内容不能为空
    ruleContent(val) {
      var reg = /^[1-9]\d*$|^0$/;
      if (val.length > 0) {
        if (!reg.test(val)) {
          this.$message.warning("请在排序中输入数字!");
        }
      } else {
        this.$message.warning("请在排序中输入数字!");
      }
    }
  },
  created() {
    this.getTableHead();
  },
  mounted() {
    setTimeout(() => {
      this.getTableBodyData();
    }, 100);
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
