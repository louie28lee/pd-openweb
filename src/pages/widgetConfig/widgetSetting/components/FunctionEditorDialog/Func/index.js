import React, { useEffect, useRef } from 'react';
import { arrayOf, func, shape } from 'prop-types';
import styled from 'styled-components';
import EventEmitter from 'events';
import { validateFnExpression } from 'src/pages/worksheet/util';
import SelectFnControl from './common/SelectFnControl';
import CodeEdit from './common/CodeEdit';
import Tip from './common/Tip';
import Footer from './common/Footer';
import './style.less';
import cx from 'classnames';

window.emitter = new EventEmitter();

const Con = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  color: #333;
`;
const Header = styled.div`
  height: 50px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 17px;
  font-weight: bold;
  padding: 0 24px;
  line-height: 50px;
`;
const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
`;
const SelectFnControlCon = styled.div`
  width: 320px;
  background: #fafafa;
`;
const Dev = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0 24px;
  overflow: hidden;
`;
const CodeEditCon = styled.div`
  flex: 1;
  height: 260px;
`;
const TipCon = styled.div`
  height: 200px;
  border-top: 1px solid #f0f0f0;
`;

export default function Func(props) {
  const { value: { expression } = {}, title, renderTag, onClose, controlGroups, onSave, className } = props;
  let { controls = [] } = props;
  if (_.isArray(controlGroups)) {
    controls = _.flatten(controlGroups.map(group => group.controls));
  }
  const codeEditor = useRef();
  const editorFunctions = key => {
    return (...args) => {
      if (codeEditor.current) {
        codeEditor.current[key](...args);
      } else {
        console.error('codeEditor mount failed');
      }
    };
  };
  function handleSave() {
    if (codeEditor.current) {
      const expression = codeEditor.current.getValue();
      let available = validateFnExpression(expression);
      const controlIds = (expression.match(/\$(.+?)\$/g) || []).map(id => id.slice(1, -1));
      if (controlIds.filter(id => !_.find(controls, { controlId: id.replace(/[a-zA-Z0-9]+-/, '') })).length) {
        // 存在已删除字段
        available = false;
      }
      console.log({ available });
      onSave({
        expression,
        status: available ? 1 : -1,
      });
      onClose();
    }
  }
  return (
    <Con className={cx('functionEditor', className)}>
      <Header>{_l('编辑函数')}</Header>
      <Main>
        <SelectFnControlCon>
          <SelectFnControl
            controlGroups={controlGroups}
            controls={controls}
            insertTagToEditor={editorFunctions('insertTag')}
            insertFn={editorFunctions('insertFn')}
          />
        </SelectFnControlCon>
        <Dev>
          <CodeEditCon>
            <CodeEdit value={expression} title={title} controls={controls} ref={codeEditor} renderTag={renderTag} />
          </CodeEditCon>
          <TipCon>
            <Tip />
          </TipCon>
          <Footer onClose={onClose} onSave={handleSave} />
        </Dev>
      </Main>
    </Con>
  );
}

Func.propTypes = {
  value: shape({}),
  control: shape({}),
  controls: arrayOf(shape({})),
  controlGroups: arrayOf(shape({})), // { controlName, controlId }
  renderTag: func,
  onClose: func,
  onSave: func,
};
