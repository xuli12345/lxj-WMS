<template>
  <div class="flex-align-center">
    <span>检验科目:</span>
    <el-select
      multiple
      v-model="typeValue"
      clearable
      placeholder="请选择"
      style="width:300px"
      @input="$emit('input', typeValue)"
    >
      <el-option
        v-for="item in options"
        :key="item.fID"
        :label="item.fStateName"
        :value="item.fID"
      >
      </el-option>
    </el-select>
  </div>
</template>
<script>
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { getTableHeadData, getTableBodyData } from "@/api/index";
export default {
  data() {
    return {
      typeValue: "",
      options: [],
      userDes: this.$store.state.user.userInfo.userDes
    };
  },
  methods: {
    async getType(tableView, searchWhere) {
      let res = await getTableBodyData(tableView, searchWhere);
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));

      if (res.State) {
        let result = JSON.parse(res.Data);
        return result;
      }
    }
  },

  async created() {
    this.options = await this.getType("v_GoodState");
    console.log(this.options);
  }
};
</script>
<style lang="scss" scoped></style>
