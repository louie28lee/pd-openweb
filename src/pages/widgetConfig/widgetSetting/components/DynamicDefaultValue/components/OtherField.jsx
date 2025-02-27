import React, { Component, Fragment, useState, useEffect } from 'react';
import { string } from 'prop-types';
import cx from 'classnames';
import update from 'immutability-helper';
import { getControlType, getControls } from '../util';
import { OtherFieldWrap } from '../styled';
import { SYSTEM_FIELD_TO_TEXT } from '../config';

export default function OtherField(props) {
  const {
    dynamicValue,
    onDynamicValueChange,
    item = {},
    data,
    text,
    className,
    globalSheetInfo,
    globalSheetControls = [],
  } = props;
  const { worksheetId } = globalSheetInfo;
  const originControls = props.controls.concat(globalSheetControls);
  const [controls, setControls] = useState(originControls);

  useEffect(() => {
    setControls(originControls);
  }, [data.controlId]);

  const getFieldName = (controls, fieldId) => {
    if (_.includes(['ctime', 'utime', 'ownerid', 'caid'], fieldId)) return SYSTEM_FIELD_TO_TEXT[fieldId];
    return (
      _.get(
        _.find(controls, item => _.includes([item.controlId, item.id], fieldId)),
        'controlName',
      ) || '已删除'
    );
  };
  const getFieldNameById = (item, controls) => {
    const { cid, rcid } = item;
    const filterControls = getControls({ data, controls, isCurrent: true });
    if (rcid) {
      // 子表控件中 如果是主记录
      if (rcid === worksheetId) {
        return { fieldName: getFieldName(filterControls, cid) };
      }
      const record = _.find(controls, item => item.controlId === rcid);
      const reFilterControls = getControls({ data, controls: _.get(record, 'relationControls') });
      return {
        recordName: _.get(record, 'controlName'),
        fieldName: getFieldName(reFilterControls, cid),
      };
    } else {
      return { fieldName: getFieldName(filterControls, cid) };
    }
  };
  const delField = tag => {
    const { cid, rcid, staticValue } = tag;
    const index = _.findIndex(
      dynamicValue,
      item => item.cid === cid && item.rcid === rcid && item.staticValue === staticValue,
    );
    onDynamicValueChange(update(dynamicValue, { $splice: [[index, 1]] }));
  };
  const isFieldDeleteFn = (item, controls = []) => {
    const { cid, rcid } = item;
    const isFieldNotInControls = (controls, cid) => {
      if (_.includes(['ctime', 'utime', 'ownerid', 'caid'], cid)) return false;
      return !_.some(controls, item => _.includes([item.controlId, item.id], cid));
    };
    if (rcid) {
      // 子表控件中 主记录控件
      if (rcid === worksheetId) {
        return isFieldNotInControls(controls, cid);
      }
      const record = _.find(controls, item => item.controlId === rcid);
      if (!record) return true;
      return isFieldNotInControls(_.get(record, 'relationControls'), cid);
    } else {
      return isFieldNotInControls(controls, cid);
    }
  };
  if (text) return <span style={{ height: '26px' }}>{text}</span>;
  const isText = getControlType(data) === 'text' || data.type === 45;
  const { fieldName, recordName } = getFieldNameById(item, controls);
  const isFieldDelete = isFieldDeleteFn(item, controls);
  return (
    <OtherFieldWrap className={cx(className, { pointer: !isText, haveCloseIcon: !isText, deleted: isFieldDelete })}>
      <span className="overflow_ellipsis">
        <span>{fieldName}</span>
        {recordName && <span className="recordName">{recordName}</span>}
      </span>
      {!isText && (
        <i
          className="icon-close"
          onClick={e => {
            e.stopPropagation();
            delField(item);
          }}
        ></i>
      )}
    </OtherFieldWrap>
  );
}
