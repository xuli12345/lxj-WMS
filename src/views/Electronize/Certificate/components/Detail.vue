<template>
  <div>
    <div class="detail">
      <p>供应商名称:{{ rowData.vendorname }}</p>
      <p>货品编码:{{ rowData.goodscode }}</p>
      <p>货品名称:{{ rowData.goodsname }}</p>
      <p>批号:{{ rowData.lot }}</p>
      <p>生产日期:{{ rowData.prodate }}</p>
      <p>收货日期:{{ rowData.recdate }}</p>
      <p>图片名称:{{ rowData.fImage }}</p>
      <p>状态:{{ rowData.estat }}</p>
    </div>

    <div class="imgBox">
      <el-button
        style="margin-bottom:10px"
        type="primary"
        size="mini"
        class="iconfont icon-shanchu"
        @click="BatchDelete"
        >批量删除</el-button
      >
      <el-checkbox-group v-model="checkList">
        <el-checkbox
          :label="item.name"
          v-for="(item, index) in imgs"
          :key="index"
        >
          <viewer class="viewer" ref="viewer">
            <img :src="item.url" alt="" />
          </viewer>
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>
<script>
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { addParams, batchDelete, userLimit, compare } from "@/utils/common";
import { exportImge, addformSaveData } from "@/api/index";

export default {
  props: ["rowData", "tableHeadData"],

  data() {
    return {
      isShowImg: false,
      imgs: [],
      checkList: [],
      imgUrl: "",
      userDes: this.$store.state.user.userInfo.userDes,
      userId: this.$store.state.user.userInfo.userId
    };
  },
  methods: {
    async getImage() {
      let arrImgName = [];
      if (this.rowData.fimage && this.rowData.estat == 1) {
        arrImgName = this.rowData.fimage.split(",");
      }
      console.log(this.rowData,"rowData")
      if (arrImgName.length > 0) {
        arrImgName.forEach(async ele => {
          let res = await exportImge({
            strType: "TicketImageFile",
            strFileName: ele
          });
          // console.log(res);
          if (!res) return;
          var blob = new Blob([res], {});
          var href = window.URL.createObjectURL(blob); //创建下载的链接
          this.imgs.push({ url: href, name: ele });
          console.log(this.imgs,"imgs");
        });
      }
    },

    async BatchDelete() {
      if (this.checkList.length == 0) {
        this.$message.warning("请勾选要删除的图片!");
      } else {
        let result = [];
        let arrImgName = this.rowData.fimage.split(",");
        let currentData = JSON.parse(JSON.stringify(this.rowData));
        if (this.checkList.length == arrImgName.length) {
          currentData.fimage = "";
          currentData.estat = 0;
        } else {
          let c = arrImgName.filter(item => this.checkList.indexOf(item) == -1);
          // console.log(c, "su");
          let str = c.join(",");
          currentData.fimage = str;
          // console.log(this.checkList);
          // console.log(arrImgName);
        }
        let result1 = batchDelete(this.tableHeadData, [currentData]);
        let res = await addformSaveData([
          {
            lstSaveData: [
              {
                TableName: "t_laihuopingzheng",
                IdentityColumn: null,
                InsertRow: null,
                UpdateRow: result1.arr,
                DeleteRow: null,
                Columns: result1.columns
              }
            ]
          },
          { userDes: this.userDes, userId: this.userId }
        ]);
        res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
        console.log(res);
        if (res.State) {
          this.$message.success("删除成功!");
          this.$emit("closeBox", res.State);
        } else {
          this.$message.error(res.Message);
        }
      }
    },
    //根据用户权限，查询按钮是否禁用
    userLimit(val) {
      return userLimit(val);
    }
  },
  async created() {
    this.getImage();
    console.log(this.rowData);
  }
};
</script>
<style lang="scss" scoped>
.imgBox {
  margin-top: 50px;
}
img {
  width: 200px;
}
</style>
