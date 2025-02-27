import { renderCellText } from 'worksheet/components/CellControls';
import { getAdvanceSetting } from 'src/util';
import moment from 'moment';
import { controlState } from 'src/components/newCustomFields/tools/utils';
import { isLightColor } from 'src/util';
import { OPTION_COLORS_LIST, OPTION_COLORS_LIST_HOVER } from 'src/pages/widgetConfig/config';
export const eventStr = {
  0: 'eventAll', //全部
  1: 'eventScheduled', //已排期
  2: 'eventNoScheduled', //未排期
};
export const getHoverColor = color => {
  return OPTION_COLORS_LIST_HOVER[OPTION_COLORS_LIST.indexOf(color.toUpperCase())];
};
export const isEmojiCharacter = substring => {
  for (var i = 0; i < substring.length; i++) {
    var hs = substring.charCodeAt(i);
    if (0xd800 <= hs && hs <= 0xdbff) {
      if (substring.length > 1) {
        var ls = substring.charCodeAt(i + 1);
        var uc = (hs - 0xd800) * 0x400 + (ls - 0xdc00) + 0x10000;
        if (0x1d000 <= uc && uc <= 0x1f77f) {
          return true;
        }
      }
    } else if (substring.length > 1) {
      var ls = substring.charCodeAt(i + 1);
      if (ls == 0x20e3) {
        return true;
      }
    } else {
      if (0x2100 <= hs && hs <= 0x27ff) {
        return true;
      } else if (0x2b05 <= hs && hs <= 0x2b07) {
        return true;
      } else if (0x2934 <= hs && hs <= 0x2935) {
        return true;
      } else if (0x3297 <= hs && hs <= 0x3299) {
        return true;
      } else if (
        hs == 0xa9 ||
        hs == 0xae ||
        hs == 0x303d ||
        hs == 0x3030 ||
        hs == 0x2b55 ||
        hs == 0x2b1c ||
        hs == 0x2b1b ||
        hs == 0x2b50
      ) {
        return true;
      }
    }
  }
};

// type === 16 ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
//格式events数据//根据多组时间拆分出多条数据
export const setDataFormat = pram => {
  const { worksheetControls = [], currentView = {}, calendarData = {}, byRowId, ...data } = pram;
  if (byRowId) {
    return setDataFormatByRowId(pram);
  }
  const { hiddenDays = [], colorOptions = [], btnList, initialView, calendarInfo = [] } = calendarData;
  const { colorid = '' } = getAdvanceSetting(currentView);
  let titleControls = worksheetControls.find(item => item.attribute === 1) || [];
  let coloridData = data[colorid] ? JSON.parse(data[colorid])[0] : '';
  if (!coloridData && colorid) {
    let colorControls = worksheetControls.find(item => item.controlId === colorid) || {};
    let defaultS = colorControls.default || '[]';
    //无选项，取默认值
    coloridData = JSON.parse(defaultS)[0];
  }
  //无选项且无默认值，才用默认颜色
  let stringColor = (colorOptions.find(it => coloridData === it.key) || []).color || '#2196f3';
  let list = [];
  calendarInfo.map(o => {
    if (!!data[o.begin]) {
      let start = !data[o.begin] ? '' : moment(data[o.begin]).format(o.startFormat);
      let isOverOneDay =
        moment(data[o.end]).format('YYYYMMDD') - moment(data[o.begin]).format('YYYYMMDD') >= 1 ||
        moment(data[o.end]).diff(moment(data[o.begin]), 'minutes') >= 1439;
      let allDay = data[o.begin] && data[o.end] && isOverOneDay && moment(data[o.begin]).isBefore(data[o.end]);
      allDay = allDay || o.startData.type === 15; //开始时间为日期字段，均处理成全天事件
      let end =
        !data[o.end] || moment(data[o.begin]).isAfter(data[o.end])
          ? ''
          : moment(
              //全天事件 都要加一天
              !allDay ? moment(data[o.end]) : moment(data[o.end]).add(1, 'day'),
            ).format(o.endFormat);
      list.push({
        ...o,
        info: o,
        keyIds: `${data.rowid}-${o.begin}`,
        extendedProps: {
          ...data,
          editable: controlState(worksheetControls.find(item => item.controlId === data[o.begin]) || []).editable,
          stringColor,
        },
        title:
          renderCellText({
            ...titleControls,
            value: data[titleControls.controlId],
          }) || _l('未命名'),
        start,
        end,
        allDay: !!allDay,
        timeList: [
          {
            info: o,
            start,
            end,
            allDay: !!allDay,
          },
        ],
        backgroundColor: stringColor,
        borderColor: stringColor,
        textColor: stringColor && isLightColor(stringColor) ? '#333' : '#fff',
      });
    }
  });
  return list;
};
//格式events数据//未排期 以及全部 一条数据卡片显示多个时间信息
export const setDataFormatByRowId = pram => {
  const { worksheetControls = [], currentView = {}, calendarData = {}, ...data } = pram;
  const { colorOptions = [], calendarInfo = [] } = calendarData;
  const { colorid = '' } = getAdvanceSetting(currentView);
  let titleControls = worksheetControls.find(item => item.attribute === 1) || [];
  let coloridData = data[colorid] ? JSON.parse(data[colorid])[0] : '';
  if (!coloridData && colorid) {
    let colorControls = worksheetControls.find(item => item.controlId === colorid) || {};
    let defaultS = colorControls.default || '[]';
    //无选项，取默认值
    coloridData = JSON.parse(defaultS)[0];
  }
  //无选项且无默认值，才用默认颜色
  let stringColor = (colorOptions.find(it => coloridData === it.key) || []).color || '#2196f3';
  let timeList = [];
  calendarInfo.map(o => {
    let start = !data[o.begin] ? '' : moment(data[o.begin]).format(o.startFormat);
    let isOverOneDay =
      moment(data[o.end]).format('YYYYMMDD') - moment(data[o.begin]).format('YYYYMMDD') >= 1 ||
      moment(data[o.end]).diff(moment(data[o.begin]), 'minutes') >= 1439;
    let allDay = data[o.begin] && data[o.end] && isOverOneDay && moment(data[o.begin]).isBefore(data[o.end]);
    allDay = allDay || o.startData.type === 15; //开始时间为日期字段，均处理成全天事件
    let end =
      !data[o.end] || moment(data[o.begin]).isAfter(data[o.end])
        ? ''
        : moment(
            //全天事件 都要加一天
            !allDay ? moment(data[o.end]) : moment(data[o.end]).add(1, 'day'),
          ).format(o.endFormat);
    timeList.push({
      info: o,
      start,
      end,
      allDay: !!allDay,
    });
  });
  return [
    {
      extendedProps: {
        ...data,
        editable: controlState(worksheetControls.find(item => item.controlId === data[o.begin]) || []).editable,
        stringColor,
      },
      title:
        renderCellText({
          ...titleControls,
          value: data[titleControls.controlId],
        }) || _l('未命名'),

      timeList,
      backgroundColor: stringColor,
      borderColor: stringColor,
      textColor: stringColor && isLightColor(stringColor) ? '#333' : '#fff',
    },
  ];
};
export const getCalendarViewType = (strType, data) => {
  const str = !['1', '2'].includes(strType)
    ? 'dayGridMonth'
    : strType === '1'
    ? isTimeStyle(data)
      ? 'timeGridWeek'
      : 'dayGridWeek'
    : isTimeStyle(data)
    ? 'timeGridDay'
    : 'dayGridDay';
  return str;
};

export const isTimeStyle = (data = {}) => {
  return data.type === 16 || (data.type === 38 && data.enumDefault === 2 && data.unit !== '3');
};

export const getTimeControls = controls => {
  return controls.filter(
    item =>
      item.controlId !== 'utime' && (_.includes([15, 16], item.type) || (item.type === 38 && item.enumDefault === 2)),
  );
};
