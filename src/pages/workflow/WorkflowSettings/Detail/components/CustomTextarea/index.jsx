import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TagTextarea } from 'ming-ui';
import SelectOtherFields from '../SelectOtherFields';
import Tag from '../Tag';

export default class CustomTextarea extends Component {
  static propTypes = {
    processId: PropTypes.string,
    selectNodeId: PropTypes.string,
    sourceAppId: PropTypes.string,
    type: PropTypes.number,
    height: PropTypes.number,
    content: PropTypes.string,
    formulaMap: PropTypes.object,
    getRef: PropTypes.func,
    onFocus: PropTypes.func,
    onChange: PropTypes.func,
    updateSource: PropTypes.func,
    operatorsSetMargin: PropTypes.bool,
    className: PropTypes.string,
  };

  static defaultProps = {
    getRef: () => {},
    onFocus: () => {},
    operatorsSetMargin: false,
    sourceAppId: '',
    className: '',
  };

  state = {
    fieldsVisible: false,
  };

  componentDidMount() {
    this.props.getRef(this.tagtextarea);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.tagtextarea && prevProps.content !== this.props.content) {
      const cursor = this.tagtextarea.cmObj.getCursor();

      this.tagtextarea.setValue(this.props.content);
      this.tagtextarea.cmObj.setCursor(cursor);
    }
  }

  render() {
    const {
      processId,
      selectNodeId,
      sourceAppId,
      type,
      height,
      content,
      formulaMap,
      onFocus,
      onChange,
      updateSource,
      operatorsSetMargin,
      className,
    } = this.props;
    const { fieldsVisible } = this.state;

    return (
      <div className="flexRow mTop10 relative">
        <TagTextarea
          className={`flex ${className}`}
          height={height}
          defaultValue={content || ''}
          operatorsSetMargin={operatorsSetMargin}
          getRef={tagtextarea => {
            this.tagtextarea = tagtextarea;
          }}
          onFocus={onFocus}
          renderTag={(tag, options) => {
            const ids = tag.split('-');
            const nodeObj = formulaMap[ids[0]] || {};
            const controlObj = formulaMap[ids[1]] || {};

            return (
              <Tag
                flowNodeType={nodeObj.type}
                appType={nodeObj.appType}
                actionId={nodeObj.actionId}
                nodeName={nodeObj.name || ''}
                controlName={controlObj.name || ''}
              />
            );
          }}
          onChange={onChange}
        />
        <SelectOtherFields
          item={{ type }}
          fieldsVisible={fieldsVisible}
          processId={processId}
          selectNodeId={selectNodeId}
          sourceAppId={sourceAppId}
          handleFieldClick={obj => {
            const newFormulaMap = _.cloneDeep(formulaMap);
            newFormulaMap[obj.nodeId] = {
              type: obj.nodeTypeId,
              appType: obj.appType,
              actionId: obj.actionId,
              name: obj.nodeName,
            };
            newFormulaMap[obj.fieldValueId] = { type: obj.fieldValueType, name: obj.fieldValueName };

            updateSource({ formulaMap: newFormulaMap }, () => {
              this.tagtextarea.insertColumnTag(`${obj.nodeId}-${obj.fieldValueId}`);
            });
          }}
          openLayer={() => this.setState({ fieldsVisible: true })}
          closeLayer={() => this.setState({ fieldsVisible: false })}
        />
      </div>
    );
  }
}
