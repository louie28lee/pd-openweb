import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from 'worksheet/redux/actions/gunterview';
import RecordInfoWrapper from 'worksheet/common/recordInfo/RecordInfoWrapper';
import { formatRecordTime, fillRecordTimeBlockColor } from 'src/pages/worksheet/views/GunterView/util';

@connect(
  state => ({
    ..._.pick(state.sheet.gunterView, ['viewConfig', 'grouping']),
    ..._.pick(state.sheet, ['isCharge', 'base', 'worksheetInfo', 'controls', 'sheetSwitchPermit']),
  }),
  dispatch => bindActionCreators(actions, dispatch),
)
export default class RecordInfo extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    const { row } = this.props;
    this.props.updateEditIndex(row.rowid);
  }
  getCurrentSheetRows() {
    const { row, grouping } = this.props;
    const { groupId } = row;
    const { rows } = _.find(grouping, { key: groupId }) || {};
    return rows;
  }
  render() {
    const { row, isCharge, base, controls, worksheetInfo, sheetSwitchPermit, viewConfig, onClose } = this.props;
    return (
      <RecordInfoWrapper
        showPrevNext
        sheetSwitchPermit={sheetSwitchPermit}
        from={1}
        visible
        recordId={row.rowid}
        projectId={worksheetInfo.projectId}
        worksheetId={worksheetInfo.worksheetId}
        rules={worksheetInfo.rules}
        currentSheetRows={this.getCurrentSheetRows()}
        hideRecordInfo={onClose}
        hideRows={onClose}
        updateRows={(ids, newItem, updateControls) => {
          this.props.updateRecord(row, updateControls, newItem);
        }}
        isCharge={isCharge}
        appId={worksheetInfo.appId}
        viewId={base.viewId}
      />
    );
  }
}
