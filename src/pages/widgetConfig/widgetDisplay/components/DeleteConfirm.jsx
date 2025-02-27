import React from 'react';
import Trigger from 'rc-trigger';
import { Button } from 'ming-ui';
import styled from 'styled-components';
import 'rc-trigger/assets/index.css';

const DeleteConfirmWrap = styled.div`
  width: 320px;
  padding: 22px 24px;
  background: #ffffff;
  border-radius: 3px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.24);
  .title {
    font-size: 15px;
    color: #333333;
  }
  .hint {
    color: #757575;
    margin: 16px 0 32px 0;
  }
  .btnList {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    .cancel {
      color: #9e9e9e;
      margin-right: 24px;
      cursor: pointer;
    }
  }
`;

export default function DeleteConfirm({
  visible,
  children,
  onVisibleChange,
  onOk,
  onCancel,
  title = _l('确定要删除此控件'),
  hint = _l('删除后对应表单数据也会被删除且无法恢复'),
  cancelText = _l('取消'),
  okText = _l('删除'),
  footer,
  content,
  ...rest
}) {
  return (
    <Trigger
      popupVisible={visible}
      onPopupVisibleChange={onVisibleChange}
      action={['click']}
      popupAlign={{
        points: ['tr', 'br'],
        offset: [0, 5],
        overflow: { adjustX: true, adjustY: true },
      }}
      popup={
        content || (
          <DeleteConfirmWrap>
            <div className="title">{title}</div>
            <div className="hint">{hint}</div>
            {footer || (
              <div className="btnList">
                <div
                  className="cancel"
                  onClick={e => {
                    e.stopPropagation();
                    onCancel();
                  }}>
                  {cancelText}
                </div>
                <Button
                  type="danger"
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onOk();
                  }}>
                  {okText}
                </Button>
              </div>
            )}
          </DeleteConfirmWrap>
        )
      }
      onCancel={onCancel}
      {...rest}>
      {children}
    </Trigger>
  );
}
