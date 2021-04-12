<template>
  <div>
    <div class="page flex-wrap">
      <div
        class="search-title flex-align-center"
        v-for="(item, index) in searchData"
        :key="index"
      >
        <p>{{ item.fColumnDes }}:</p>

        <el-checkbox
          v-if="item.fDataType == 'bit'"
          v-model="asData[item.fColumn]"
        ></el-checkbox>

        <el-row
          v-else-if="
            item.fDataType == 'datetime' && item.fComputer == 'between'
          "
        >
          <el-col :span="11">
            <el-date-picker
              v-model.trim="startData[item.fColumn]"
              type="date"
              placeholder="请输入范围值"
            >
            </el-date-picker>
          </el-col>
          <el-col :span="2">——</el-col>
          <el-col :span="11">
            <el-date-picker
              v-model.trim="endData[item.fColumn]"
              type="date"
              placeholder="请输入范围值"
            >
            </el-date-picker>
          </el-col>
        </el-row>
        <el-date-picker
          v-else-if="item.fDataType == 'datetime'"
          v-model.trim="asData[item.fColumn]"
          type="date"
          placeholder="选择日期时间"
          min-width="300"
        ></el-date-picker>
        <!-- 需要使用下拉选择框的 -->
        <template
          v-else-if="
            homeSelArr && homeSelArr.length > 0 && selectFunction(item.fColumn)
          "
        >
          <el-select
            clearable
            filterable
            v-model="asData[item.fColumn]"
            @change="getVal(asData[item.fColumn], item.fColumn)"
          >
            <el-option
              :value="i[selectStr(item.fColumn)]"
              v-for="i in selectData(item.fColumn)"
              :key="i[selectVal(item.fColumn)]"
              :label="i[selectStr(item.fColumn)]"
            ></el-option>
          </el-select>
        </template>
        <el-input
          v-else
          v-model.trim="asData[item.fColumn]"
          :placeholder="`请输入${item.fColumnDes}`"
        ></el-input>
      </div>

      <div style="margin-top: 10px">
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
          class="iconfont icon-shanchu"
          @click="BatchDelete"
          :disabled="userLimit('fDel')"
          >批量删除</el-button
        >
        <el-button
          type="primary"
          class="el-icon-bottom"
          @click="downloadTemp"
          size="mini"
          >下载模板</el-button
        >

        <el-upload
          style="margin-left: 15px; float: right"
          ref="upload"
          class="upload"
          action=""
          :on-change="handleChange"
          :on-remove="handleRemove"
          :auto-upload="false"
          :show-file-list="false"
          accept="application/vnd.openxmlformats-    
        officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        >
          <el-button
            type="primary"
            class="iconfont icon-excel"
            size="mini"
            :disabled="userLimit('fInport')"
            >导入excel</el-button
          >
        </el-upload>
      </div>
    </div>
    <!--  @current-change="handleCurrentRow" -->
    <el-table
      :header-cell-style="{ background: '#eef1f6' }"
      v-fit-columns
      class="table-wrapper"
      ref="singleTable"
      border
      style="width: 100%"
      :data="tableData"
      :row-key="getRowKeys"
      @selection-change="handleSelectionChange"
      :max-height="tableHeight"
    >
      <el-table-column type="selection" width="40"></el-table-column>
      <el-table-column type="index" label="序号" width="50"></el-table-column>
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
          <template slot-scope="scope">
            <div v-if="item.fColumn == 'estat'">
              <el-button
                v-if="scope.row.estat == 0"
                type="warning"
                size="mini"
                round
              ></el-button>
              <el-button v-else type="success" round size="mini"></el-button>
            </div>
            <div v-else>{{ scope.row[item.fColumn] }}</div>
          </template>
        </el-table-column>
      </template>

      <el-table-column fixed="right" label="操作" align="center" width="220">
        <template slot-scope="scope">
          <div class="operation">
            <el-button
              type="text"
              @click.stop="ImageUpload(scope.row, scope.$index)"
              size="small"
              >上传</el-button
            >

            <el-button
              type="text"
              size="small"
              @click="takePhone(scope.row, scope.$index)"
              >拍照</el-button
            >

            <el-button
              type="text"
              size="small"
              @click="handleEdit(scope.row, scope.$index)"
              >查看</el-button
            >
            <el-button
              type="text"
              size="small"
              @click="handleDelete(scope.row, scope.$index)"
              :disabled="userLimit('fDel')"
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

    <!-- 上传图片  -->
    <el-dialog
      title="上传图片"
      :visible.sync="dialogVisible"
      @close="closeDialog"
      width="30%"
    >
      <!--    :limit="1"
        :on-exceed="handleExceed" -->
      <el-upload
        class="avatar-uploader"
        action="#"
        list-type="picture-card"
        :on-success="handleSuccess"
        :before-upload="beforerUpload"
        :auto-upload="false"
        :on-change="onChange"
        :file-list="fileListArray"
        ref="upload"
      >
        <i slot="default" class="el-icon-plus avatar-uploader-icon"></i>
        <div slot="file" slot-scope="{ file }">
          <img class="avatar" :src="file.url" alt ref="uploadImg" />
          <span class="el-upload-list__item-actions">
            <span
              class="el-upload-list__item-preview"
              @click="handlePictureCardPreview(file)"
            >
              <i class="el-icon-zoom-in"></i>
            </span>
            <span
              v-if="!disabled"
              class="el-upload-list__item-delete"
              @click="handlerRemove(file)"
            >
              <i class="el-icon-delete"></i>
            </span>
          </span>
        </div>
      </el-upload>
      <el-dialog :visible.sync="fDialogVisible">
        <img width="100%" :src="dialogImageUrl" alt />
      </el-dialog>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" @click="closeDialog">
          <i class="iconfont icon-quxiao"></i>取 消
        </el-button>
        <el-button size="mini" type="primary" @click="saveImage">
          <i class="iconfont icon-baocun"></i>保存
        </el-button>
      </div>
    </el-dialog>
    <!-- 修改 -->
    <el-drawer
      :modal-append-to-body="false"
      :visible.sync="drawerValue"
      direction="rtl"
      :before-close="handleEditClose"
      v-if="isDestory"
    >
      <Detail
        @closeBox="closeEditBox"
        :rowData="editForm"
        :tableHeadData="tableHeadData"
      ></Detail>
    </el-drawer>
    <!-- 拍照 -->
    <el-dialog :visible.sync="dialogImgVisible" width="50%">
      <div>
        <!-- <video id="video" v-show="videoShow" src=""></video> -->
        <!-- <canvas id="canvasId" v-show="false" width="200" height="200"></canvas> -->
        <!-- src="../../../assets/img/about_banner.jpg"  -->
        <img
          alt=""
          id="devPhoto"
          style="width:300px;height:200px;display:block;margin:20px auto"
        />
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button
          size="mini"
          type="primary"
          id="rotateLeft"
          @click="handleImgRotate"
        >
          <i class="iconfont icon-gengxin"></i>旋转图片</el-button
        >
        <el-button size="mini" type="primary" @click="confirmImg">
          <i class="iconfont icon-baocun"></i>保存图片</el-button
        >
        <el-button size="mini" @click="cancleImg">
          <i class="iconfont icon-quxiao"></i>取 消</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { decryptDesCbc } from "@/utils/cryptoJs.js"; //解密
import { timeCycle, updateTime } from "@/utils/updateTime"; //格式化时间
import { batchDelete, userLimit, compare, addParams } from "@/utils/common";
import {
  InportImage,
  addformSaveData,
  getTableBodyData,
  getTableHeadData,
  imPortExcel
} from "@/api/index";
import Detail from "./components/Detail";
import { QWebChannel } from "@/utils/qwebchannel";
import { tempUrl } from "@/utils/tempUrl";

export default {
  components: {
    Detail
  },
  data() {
    return {
      getRowKeys(row) {
        return row.fid;
      },
      searchData: [],
      tableHeadData: [],
      asData: {},
      editForm: {},
      searchWhere: [
        {
          vendorname: "",
          goodsname: "",
          prodate: "",
          lot: "",
          recdate: "",
          estat: ""
        }
      ],
      fTableViewData: "",
      //表格数据
      tableData: [],
      BatchList: [],
      // 当前页数
      pageNum: 1,
      // 每页条数
      pageSize: 10,
      total: 0,
      endData: {},
      startData: {},
      currentRow: {}, //当前行
      dialogImgVisible: false,
      disabled: false,
      dialogVisible: false, //图片上传弹窗
      fDialogVisible: false, //图片预览
      dialogImageUrl: "", //图片预览路径
      imageFile: "",
      fileListArray: [],
      drawerValue: false,
      isDestory: false,
      fileList: [],
      videoShow: false,
      canvas: "",
      photoInfo: "",
      asData: {},
      //excel
      fileTemp: null,
      strType: "laihuopingzheng",
      selectAllData: [],
      homeSelArr: [
        {
          fName: "estat",
          fUrl: "",
          fDes: "fStateDes",
          fID: "estat",
          isShowSel: false
        }
      ],

      //这里是设置参数的，因为我的项目暂时不需要更改，所以设了默认值，有需要的可以自行更改
      baseUrl: "",
      options: [],
      value: "",
      tableHeight: document.body.clientHeight,
      userDes: this.$store.state.user.userInfo.userDes,
      userId: this.$store.state.user.userInfo.userId
    };
  },
  methods: {
    handleImgRotate() {
      const _this = this;
      const socket = new WebSocket(this.baseUrl);
      socket.onclose = function() {
        // console.error("web channel closed");
        this.$message.warning("web channel closed");
      };
      socket.onerror = function(error) {
        this.$message.warning(error);
        // console.error("web channel error: " + error);
      };
      socket.onopen = function() {
        new QWebChannel(socket, function(channel) {
          // make dialog object accessible globally
          window.dialog = channel.objects.dialog;
          //网页关闭函数
          window.onbeforeunload = function() {
            dialog.get_actionType("closeSignal");
          };
          window.onunload = function() {
            dialog.get_actionType("closeSignal");
          };

          dialog.photoBtnClicked("primaryDev_");
          dialog.get_actionType("savePhotoPriDev");
          //左转
          document.getElementById("rotateLeft").onclick = function() {
            dialog.get_actionType("rotateLeft");
          };
          //接收拍照base64
          dialog.send_priPhotoData.connect(function(message) {
            var element = document.getElementById("devPhoto");
            element.src = "data:image/jpg;base64," + message;
            _this.photoInfo = "data:image/jpg;base64," + message;
          });
          // output("ready to send/receive messages!");
          //网页加载完成信号

          dialog.html_loaded("one");
        });
      };
    },

    openSocket() {
      let that = this;
      const socket = new WebSocket(this.baseUrl);
      socket.onclose = function() {
        // console.error("web channel closed");
        this.$message.warning("web channel closed");
      };
      socket.onerror = function(error) {
        this.$message.warning(error);
        // console.error("web channel error: " + error);
      };
      socket.onopen = function() {
        new QWebChannel(socket, function(channel) {
          // make dialog object accessible globally
          window.dialog = channel.objects.dialog;
          //网页关闭函数
          window.onbeforeunload = function() {
            dialog.get_actionType("closeSignal");
          };
          window.onunload = function() {
            dialog.get_actionType("closeSignal");
          };

          dialog.photoBtnClicked("primaryDev_");
          dialog.get_actionType("savePhotoPriDev");
          //左转
          document.getElementById("rotateLeft").onclick = function() {
            dialog.get_actionType("rotateLeft");
          };
          //接收拍照base64
          dialog.send_priPhotoData.connect(function(message) {
            var element = document.getElementById("devPhoto");
            // element.src = "data:image/jpg;base64," + message;
            that.photoInfo = "data:image/jpg;base64," + message;
          });
          // output("ready to send/receive messages!");
          //网页加载完成信号
          dialog.html_loaded("one");
        });
      };
    },

    cancleImg() {
      this.dialogImgVisible = false;
      this.videoShow = false;
    },
    async confirmImg() {
      if (this.photoInfo) {
        var arr = this.photoInfo.split(","),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        var newName = new Date().getTime();
        newName = newName + ".jpg";
        let uploadFile = new File([u8arr], newName, { type: mime });
        let res = await InportImage({
          strType: "TicketImageFile",
          file: uploadFile
        });

        let arr1 = [];
        if (res.state) {
          if (this.currentRow.fimage) {
            arr1 = this.currentRow.fimage.split(",");
            arr1.push(newName);
            let ImgName = arr1.join();
            this.currentRow.fimage = ImgName;
          } else {
            this.currentRow.fimage = newName;
          }

          this.currentRow.estat = 1;

          let result = batchDelete(this.tableHeadData, [this.currentRow]);
          let res1 = await addformSaveData([
            {
              lstSaveData: [
                {
                  TableName: "t_laihuopingzheng",
                  IdentityColumn: null,
                  InsertRow: null,
                  UpdateRow: result.arr,
                  DeleteRow: null,
                  Columns: result.columns
                }
              ]
            },
            { userDes: this.userDes, userId: this.userId }
          ]);
          res1 = JSON.parse(decryptDesCbc(res1, String(this.userDes)));

          if (res1.State) {
            this.$message.success("上传成功!");
            this.dialogImgVisible = false;
            this.getTableData();
          } else {
            this.$message.error(res1.Message);
          }
        } else {
          this.$message.error(res.Message);
        }
      } else {
        this.$message.warning("请先拍照再确定上传照片");
      }
    },
    handleEdit(row, index) {
      this.editForm = row;
      this.drawerValue = true;
    },
    handleSelectionChange(val) {
      this.BatchList = val;
    },
    //批量删除
    BatchDelete() {
      if (this.BatchList.length == 0) {
        this.$message.warning("请选择要删除的数据!");
      } else {
        let result = batchDelete(this.tableHeadData, this.BatchList);
        this.$confirm("此操作将永久删除该数据, 是否继续?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
          .then(async () => {
            let res = await addformSaveData([
              {
                lstSaveData: [
                  {
                    TableName: "t_laihuopingzheng",
                    IdentityColumn: null,
                    InsertRow: null,
                    UpdateRow: null,
                    DeleteRow: result.arr,
                    Columns: result.columns
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
              this.$message.error(res.errstr);
            }
          })
          .catch(() => {
            this.$message({
              type: "info",
              message: "已取消删除"
            });
          });
      }
    },
    //删除
    handleDelete(row, index) {
      let resultData = addParams(this.tableHeadData, row);
      this.$confirm("此操作将永久删除该文件, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(async () => {
          let res = await addformSaveData([
            {
              lstSaveData: [
                {
                  TableName: "t_laihuopingzheng",
                  IdentityColumn: null,
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
    ImageUpload(row, index) {
      // console.log(row)
      this.currentRow = row;
      this.dialogVisible = true;
    },
    handleExceed(files) {
      console.log(files, "files限制");
      this.$message.warning(
        `当前限制选择 1个文件，本次选择了 ${files.length} 个文件`
      );
    },
    //上传成功的回调
    handleSuccess(res, file) {
      console.log(res, file, "handleSuccess");
    },
    beforerUpload(file) {
      this.imageFile = file;
      console.log(file, "beforerUpload");
      const isLt2M = file.size / 1024 / 1024 < 1;
      // console.log(isLt2M);
      if (!isLt2M) {
        this.$message.error("上传头像图片大小不能超过 1MB!");
      }
      return isLt2M;
    },
    onChange(file, fileList) {
      console.log(file, fileList);
      this.fileList = fileList;
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.fDialogVisible = true;
    },
    handlerRemove(file) {
      this.$refs.upload.clearFiles();
      this.importFile = null;
    },
    //上传图片保存
    async saveImage() {
      let arr = [];
      let tempFile, type, size, oldName, newName, uploadFile, saveImg, ImgName;
      this.fileList.forEach(async item => {
        console.log(item);
        tempFile = item.raw;
        type = item.type;
        size = item.size;
        // 获取旧名字后缀
        oldName = tempFile.name.split(".");
        newName = item.uid + "." + oldName[1];
        uploadFile = new File([tempFile], newName, { type, size });
        this.imageFile = uploadFile;
        arr.push(newName);
        arr = [...new Set(arr)];
        ImgName = arr.join();

        let res = await InportImage({
          strType: "TicketImageFile",
          file: this.imageFile
        });
        console.log(res, "eiie");
        if (res.state) {
          saveImg = res.state;
        } else {
          this.$message.error(res.Message);
        }
      });
      setTimeout(async () => {
        if (saveImg) {
          if (this.currentRow.fimage) {
            let arr = [];
            arr.push(this.currentRow.fimage);
            arr.push(ImgName);
            let str = arr.join(",");
            this.currentRow.fimage = str;
          } else {
            this.currentRow.fimage = ImgName;
          }
          this.currentRow.estat = 1;
          let result = batchDelete(this.tableHeadData, [this.currentRow]);
          let res = await addformSaveData([
            {
              lstSaveData: [
                {
                  TableName: "t_laihuopingzheng",
                  IdentityColumn: null,
                  InsertRow: null,
                  UpdateRow: result.arr,
                  DeleteRow: null,
                  Columns: result.columns
                }
              ]
            },
            { userDes: this.userDes, userId: this.userId }
          ]);
          res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
          console.log(res, "SHANGCUANG");
          if (res.State) {
            this.$message.success("上传成功!");
            this.getTableData();
            this.dialogVisible = false;
            this.imageFile = null;
          }
        }
      }, 1000);
    },

    closeDialog() {
      this.imageFile = null;
      this.dialogVisible = false;
      this.$refs.upload.clearFiles();
    },
    //用户表格列头
    async getTableHeadData() {
      let res = await getTableHeadData("t_laihuopingzheng");
      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      console.log(res);
      if (res.State) {
        this.fTableViewData = res.fTableViewData;
        this.tableHeadData = res.lstRet.sort(compare);
        console.log(this.tableHeadData, "表头1");
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
      } else {
        this.$message.error(res.Message);
      }
    },

    searchCommon() {
      this.searchWhere = [];
      if (JSON.stringify(this.asData) == "{}") {
        this.searchWhere = [];
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
            if (result == "已上传") {
              result = 1;
            } else if (result == "未上传") {
              result = 0;
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
          if (
            Ikey == key &&
            this.startData[key] != null &&
            this.endData[Ikey] != null
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
    },
    //获取table表格内容数据
    async getTableData() {
      this.searchCommon();
      let res = await getTableBodyData(
        this.fTableViewData,
        this.searchWhere,
        this.pageNum,
        this.pageSize
      );

      res = JSON.parse(decryptDesCbc(res, String(this.userDes)));
      if (res.State) {
        this.tableData = JSON.parse(res.Data);
        console.log(this.tableData, "表体内容");
      } else {
        this.$message.error(res.Message);
      }
      this.total = res.TTLPage;
    },

    //根据用户权限，查询按钮是否禁用
    userLimit(val) {
      return userLimit(val);
    },
    search() {
      this.pageNum = 1;
      this.getTableData();
    },

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
    //点击x关闭弹窗
    handleEditClose(done) {
      this.drawerValue = false;
    },
    //关闭修改弹窗
    closeEditBox(val) {
      if (val) {
        // this.isSaveSuccess = true;
        this.getTableData();
      }
      this.drawerValue = false;
    },
    takePhone(row, index) {
      console.log(row, "row");
      this.dialogImgVisible = true;
      this.currentRow = row;
      const _this = this;
      const socket = new WebSocket(this.baseUrl);
      socket.onclose = function() {
        // console.error("web channel closed");
        this.$message.warning("web channel closed");
      };
      socket.onerror = function(error) {
        this.$message.warning(error);
        // console.error("web channel error: " + error);
      };
      socket.onopen = function() {
        new QWebChannel(socket, function(channel) {
          // make dialog object accessible globally
          window.dialog = channel.objects.dialog;
          //网页关闭函数
          window.onbeforeunload = function() {
            dialog.get_actionType("closeSignal");
          };
          window.onunload = function() {
            dialog.get_actionType("closeSignal");
          };

          dialog.photoBtnClicked("primaryDev_");
          dialog.get_actionType("savePhotoPriDev");
          //左转
          document.getElementById("rotateLeft").onclick = function() {
            dialog.get_actionType("rotateLeft");
          };
          //接收拍照base64
          dialog.send_priPhotoData.connect(function(message) {
            var element = document.getElementById("devPhoto");
            element.src = "data:image/jpg;base64," + message;
            _this.photoInfo = "data:image/jpg;base64," + message;
          });
          // output("ready to send/receive messages!");
          //网页加载完成信号

          dialog.html_loaded("one");
        });
      };
    },
    //判断当前字段是否需要做下拉框 v表头所有的字段
    selectFunction(v) {
      let cc = false;
      this.homeSelArr.forEach(element => {
        if (element.fName == v) {
          cc = true;
        }
      });
      return cc;
    },
    // 获取所有需要下拉选择的内容
    async getSelectData() {
      let arr = [];
      arr = [
        {
          data: [
            {
              fID: 1,
              fStateDes: "已上传"
            },
            {
              fID: 0,
              fStateDes: "未上传"
            }
          ],
          fName: "estat"
        }
      ];

      this.selectAllData = arr;
    },
    // 下拉选择框选中值后，带出其他需要带出的值
    getVal(val, n) {
      //当前选择框对应的数据
      let arr = [];
      this.selectAllData.forEach(ele => {
        if (ele.fName == n) {
          arr = ele.data;
        }
      });
      //选中值后对应的单条数据
      let data = {};
      arr.forEach(el => {
        if (el.fID == val) {
          data = el;
        }
      });
    },
    // options下拉选择框的内容
    selectData(v) {
      let arr = [];
      this.selectAllData.forEach(ele => {
        if (ele.fName == v) {
          arr = ele.data;
        }
      });

      return arr;
    },
    //下拉选择框需要显示的label字段
    selectStr(v) {
      let str = "";
      this.homeSelArr.forEach(element => {
        if (element.fName == v) {
          str = element.fDes;
        }
      });
      return str;
    },
    //下拉选择框选择的值
    selectVal(v) {
      let str = "";
      this.homeSelArr.forEach(element => {
        if (element.fName == v) {
          str = element.fID;
        }
      });
      return str;
    },
    // excel导入
    handleChange(file, fileList) {
      this.fileTemp = file.raw;
      if (this.fileTemp) {
        if (
          this.fileTemp.type ==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          this.fileTemp.type == "application/vnd.ms-excel"
        ) {
          this.importFile(this.strType, this.fileTemp);
        } else {
          this.$message({
            type: "warning",
            message: "附件格式错误，请删除后重新上传！"
          });
        }
      } else {
        this.$message({
          type: "warning",
          message: "请上传附件！"
        });
      }
    },

    handleRemove(file, fileList) {
      this.fileTemp = null;
    },
    //下载模板
    downloadTemp() {
      window.location.href = `${tempUrl}/ImportTempModFile/货品凭证导入模板.xlsx`;
    },

    async importFile(strType, file) {
      let res = await imPortExcel({
        strType: strType,
        file: file
      });
      console.log(res, "ieieieie");
      if (res.state) {
        this.$message.success("导入成功!");
        this.getTableData();
      } else {
        this.$message.error(res.message);
      }
    }
  },
  async created() {
    this.getTableHeadData();
    if (this.homeSelArr && this.homeSelArr.length > 0) {
      this.getSelectData();
    }
  },
  mounted() {
    //初始化方法
    this.baseUrl = "ws://127.0.0.1:12345";
    this.openSocket();
  },
  computed: {
    mainTabs: {
      get() {
        return this.$store.state.common.mainTabs;
      }
    }
  },
  watch: {
    drawerValue: function(val, old) {
      if (val) {
        this.isDestory = true;
      } else {
        setTimeout(() => {
          this.isDestory = false;
        }, 500);
      }
    },
    mainTabs(e, o) {
      let name = this.$options._parentVnode.data.key.substring(1);
      let n = e.filter(ele => {
        return ele.name == name;
      });
      if (n.length == 0) {
        var key =
          this.$vnode.key == null
            ? this.$vnode.componentOptions.Ctor.cid +
              (this.$vnode.componentOptions.tag
                ? `::${this.$vnode.componentOptions.tag}`
                : "")
            : this.$vnode.key;
        var cache = this.$vnode.parent.componentInstance.cache;
        var keys = this.$vnode.parent.componentInstance.keys;
        if (cache[key]) {
          if (keys.length) {
            var index = keys.indexOf(key);
            if (index > -1) {
              keys.splice(index, 1);
            }
          }
          delete cache[key];
        }
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.avatar-uploader {
  text-align: center;
}
/deep/ .avatar-uploader .el-upload {
  border: 1px dashed #777 !important;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
/deep/ .avatar-uploader .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 148px;
  height: 148px;
  line-height: 148px;
  text-align: center;
}
.avatar {
  width: 148px;
  height: 148px;
  display: block;
}
</style>
