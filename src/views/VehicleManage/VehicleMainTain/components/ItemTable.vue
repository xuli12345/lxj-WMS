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
      <template>
        <el-table-column type="index" width="50"></el-table-column>
        <template v-for="(item, index) in tableHeadData">
          <el-table-column
            v-if="item.fVisible == 1 ? true : false"
            :key="index"
            :label="item.fColumnDes"
            :prop="item.fColumn"
            sortable
            min-width="120px"
          ></el-table-column>
        </template>
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
export default {
  props: ["tableHeadData", "ItemTableData"],
  data() {
    return {
      tableData: [],
      pageNum: 1,
      pageSize: 10,
      total: 0,
      tableHeight: document.body.clientHeight,
      userDes: this.$store.state.user.userInfo.userDes,
      userId: this.$store.state.user.userInfo.userId,
      sqlConn: sessionStorage.getItem("sqlConn")
    };
  },
  watch: {
    ItemTableData(newVal, oldVal) {
      this.tableData = newVal;
      this.total = this.tableData.length;
    }
  },
  methods: {
    handleDelete(val, index) {
      this.tableData.splice(index, 1);
    },
    // 页容量
    handleSizeChange(val) {
      this.pageSize = val;
    },
    // 当前页
    handleCurrentChange(val) {
      this.pageNum = val;
    }
  }
};
</script>
<style lang="scss" scoped></style>
