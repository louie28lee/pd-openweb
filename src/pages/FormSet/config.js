// 工作表维度 都是1开  10=显示创建按钮  11=工作表讨论  12=工作表日志  13=导入数据
// 视图都是2开头  20=分享视图  21=导出视图下记录  22=快捷操作  23=二维码打印
// 记录都是3开头  30=分享记录  31=发送填写记录  32=系统打印  33=下载附件  34=查看记录操作日志  35=记录讨论
export const listConfigStr = {
  10: _l('显示创建按钮'),
  // 工作表维度 都是1开头
  11: _l('工作表讨论'),
  12: _l('工作表日志'),
  13: _l('导入数据'),
  // 视图都是2开头
  20: _l('分享视图'),
  21: _l('导出视图下记录'),
  22: _l('快捷编辑'), // quickSwitch
  23: _l('打印二维码'), //
  24: _l('批量编辑'), //
  // 记录都是3开头
  30: _l('分享记录'),
  // 31: _l('发送填写记录'),
  32: _l('系统打印'),
  33: _l('下载附件'),
  34: _l('查看记录操作日志'),
  35: _l('记录讨论'), // recordDiscussSwitch
  36: _l('记录复制'), // recordCopySwitch
};
export const listPermit = [10, 11, 12, 13, 20, 21, 23, 22, 24, 30, 36, 35, 32, 33, 34];
export const permitList = {
  createButtonSwitch: 10, // createButtonSwitch 显示创建按钮
  discussSwitch: 11, // discussSwitch 工作表讨论
  logSwitch: 12, // logSwitch 工作表日志
  importSwitch: 13, // importSwitch 导入数据
  viewShareSwitch: 20, // viewShareSwitch 分享视图
  viewExportSwitch: 21, // viewExportSwitch	导出视图下记录
  quickSwitch: 22, // quickSwitch	 快捷操作
  QrCodeSwitch: 23, // quickSwitch	 打印二维码
  batchEdit: 24, //	 批量编辑
  recordShareSwitch: 30, // recordShareSwitch 分享记录
  // recordWriteSwitch: 31, // recordWriteSwitch 发送填写记录
  recordPrintSwitch: 32, // recordPrintSwitch 系统打印
  recordAttachmentSwitch: 33, // recordAttachmentSwitch 下载附件
  recordLogSwitch: 34, // recordLogSwitch 查看记录操作日志
  recordDiscussSwitch: 35, // recordDiscussSwitch 记录讨论
  recordCopySwitch: 36, // 记录复制
};

export const MODULE_TYPE_TO_NAME = {
  alias: _l('数据名称'),
  display: _l('业务规则'),
  validationBox: _l('验证规则'),
  printTemplate: _l('打印模板'),
  functionalSwitch: _l('功能开关'),
  customBtn: _l('自定义动作'),
};
