import React, { Fragment, Component } from 'react';
import { Icon } from 'ming-ui';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import cx from 'classnames';
import { Flex, ActivityIndicator, Drawer, Button, WingBlank, Tabs } from 'antd-mobile';
import worksheetAjax from 'src/api/worksheet';
import instance from 'src/pages/workflow/api/instance';
import instanceVersion from 'src/pages/workflow/api/instanceVersion';
import CustomFields from 'src/components/newCustomFields';
import RelationList from 'src/pages/Mobile/RelationRow/RelationList';
import RelationAction from 'src/pages/Mobile/RelationRow/RelationAction';
import * as actions from 'src/pages/Mobile/RelationRow/redux/actions';
import Sidebar from './Sidebar';
import OtherAction from './OtherAction';
import Operation from './Operation';
import { formatControlToServer, controlState } from 'src/components/newCustomFields/tools/utils';
import { isRelateRecordTableControl } from 'worksheet/util';
import Back from '../components/Back';
import RecordAction from 'src/pages/Mobile/Record/RecordAction';
import ChatCount from '../components/ChatCount';
import { renderCellText } from 'worksheet/components/CellControls';
import {
  ACTION_TYPES,
  ACTION_LIST,
  ACTION_TO_METHOD,
  OPERATION_TYPE,
  OPERATION_LIST,
} from 'src/pages/workflow/components/ExecDialog/config';
import './index.less';

const { operation } = instance;
const isWxWork = window.navigator.userAgent.toLowerCase().includes('wxwork');
const isWeLink = window.navigator.userAgent.toLowerCase().includes('huawei-anyoffice');

class ProcessRecord extends Component {
  constructor(props) {
    super(props);
    this.state = {
      random: '',
      sheetRow: {},
      instance: {},
      receiveControls: [],
      loading: true,
      open: false,
      isEdit: false,
      operationVisible: false,
      otherActionVisible: false,
      action: '',
      selectedUser: {},
      viewId: '',
      rowId: '',
      worksheetId: '',
      submitLoading: false,
      submitAction: null,
      isError: false,
      recordActionVisible: false,
      originalData: null,
      customBtns: [],
      currentTab: {},
      isHasten: false,
    };
  }
  customwidget = React.createRef();
  recordRef = React.createRef();
  operrationRef = React.createRef();
  componentDidMount() {
    const { params } = this.props.match;
    worksheetAjax
      .getWorkItem({
        instanceId: params.instanceId,
        workId: params.workId,
      })
      .then(({ rowId, worksheetId, viewId }) => {
        if (_.isEmpty(rowId) || _.isEmpty(worksheetId)) {
          this.setState({ isError: true, loading: false });
          return;
        }
        this.setState(
          {
            viewId,
            rowId,
            worksheetId,
          },
          () => {
            viewId && this.loadCustomBtns();
            this.loadRow();
          },
        );
      })
      .fail(error => {
        this.setState({ isError: true, loading: false });
      });
  }
  loadRow = () => {
    const { params } = this.props.match;
    const { viewId, rowId, worksheetId, instance } = this.state;
    Promise.all([
      worksheetAjax.getRowByID({
        ...params,
        viewId,
        rowId,
        worksheetId,
        getType: 9,
        checkView: true,
      }),
      instanceVersion.get({
        id: params.instanceId,
        workId: params.workId,
      }),
    ]).then(([sheetRow, instance]) => {
      const { receiveControls, view } = sheetRow;
      const newReceiveControls = viewId
        ? receiveControls
        : receiveControls
            .map(c => Object.assign({}, c, { fieldPermission: '111' }))
            .filter(item => item.type !== 21 && !_.includes(view ? view.controls : [], item.controlId));
      sheetRow.receiveControls = newReceiveControls;
      this.setState({
        receiveControls: newReceiveControls,
        originalData: receiveControls,
        sheetRow,
        loading: false,
        instance,
        random: Date.now(),
      });
    });
  };
  loadCustomBtns = () => {
    const { viewId, rowId, worksheetId } = this.state;
    worksheetAjax
      .getWorksheetBtns({
        viewId,
        rowId,
        worksheetId,
      })
      .then(data => {
        this.setState({
          customBtns: data,
        });
      });
  };
  handleOpenChange = () => {
    this.setState({
      open: !this.state.open,
    });
  };
  handleSave(fn) {
    const { worksheetId, rowId, sheetRow, viewId, instance } = this.state;
    const { flowNode } = instance;
    const { ignoreRequired } = flowNode;
    const { params } = this.props.match;
    const { projectId, receiveControls } = sheetRow;
    const { data, updateControlIds, hasError, hasRuleError } = this.customwidget.current.getSubmitData({
      ignoreAlert: true,
    });
    const cells = data
      .filter(item => updateControlIds.indexOf(item.controlId) > -1 && item.type !== 30)
      .map(formatControlToServer);

    if (hasError && !ignoreRequired) {
      alert(_l('请正确填写记录'), 3);
      return;
    }

    if (viewId && _.isEmpty(cells)) {
      this.setState({ isEdit: false, random: Date.now() });
      return;
    }

    if (hasRuleError) {
      fn && fn();
      return;
    }

    worksheetAjax
      .updateWorksheetRow({
        ...params,
        getType: 9,
        projectID: projectId,
        rowId,
        worksheetId,
        newOldControl: cells,
      })
      .then(result => {
        if (result && result.data) {
          alert(_l('保存成功'));
          const newReceiveControls = receiveControls.map(c => _.assign({}, c, { value: result.data[c.controlId] }));
          this.setState({
            isEdit: false,
            random: Date.now(),
            sheetRow: Object.assign(sheetRow, { receiveControls: newReceiveControls }),
            originalData: newReceiveControls,
          });
          fn && fn();
        } else {
          alert(_l('保存失败，请稍后重试'), 2);
        }
      })
      .fail(error => {
        alert(_l('保存失败，请稍后重试'), 2);
      });
  }
  handleFooterBtnClick = id => {
    const { hasError, hasRuleError } = this.customwidget.current.getSubmitData({ ignoreAlert: true });
    let { instance } = this.state;
    const { flowNode } = instance;
    const { ignoreRequired } = flowNode;
    if (hasError && (!ignoreRequired || (ignoreRequired && id !== 'overrule'))) {
      alert(_l('请正确填写记录'), 3);
      return;
    }

    if (hasRuleError) {
      return;
    }

    const { submitLoading } = this.state;
    if (submitLoading) return;

    this.setState({ submitAction: id });

    if (id === 'submit') {
      this.handleSave(() => {
        this.request('submit');
      });
      return;
    }
    if (id === 'revoke') {
      this.handleSave(() => {
        this.request('revoke');
      });
      return;
    }
    this.setState({
      action: id,
      otherActionVisible: true,
    });
  };
  handleAction = (action, content, forwardAccountId, backNodeId, signature) => {
    content = content.trim();
    /**
     * 加签
     */
    if (_.includes(['before', 'after'], action)) {
      this.handleSave(() => {
        this.request(ACTION_TO_METHOD[action], { before: action === 'before', opinion: content, forwardAccountId });
      });
    }

    /**
     * 转审或转交
     */
    if (_.includes(['transferApprove', 'transfer'], action)) {
      this.request(ACTION_TO_METHOD[action], { opinion: content, forwardAccountId });
    }

    /**
     * 通过或拒绝审批
     */
    if (_.includes(['pass', 'overrule'], action)) {
      this.handleSave(() => {
        this.request(ACTION_TO_METHOD[action], { opinion: content, backNodeId, signature });
      });
    }

    /**
     * 添加审批人
     */
    if (_.includes(['addApprove'], action)) {
      this.request('operation', { opinion: content, forwardAccountId, operationType: OPERATION_TYPE[action] });
    }
  };
  request = (action, restPara = {}) => {
    const { params } = this.props.match;
    const { instanceId, workId } = params;
    const { submitLoading } = this.state;
    if (submitLoading) return;
    this.setState({ submitLoading: true, otherActionVisible: false });
    instance[action]({ id: instanceId, workId, ...restPara }).then(() => {
      this.props.history.push('/mobile/processMatters');
    });
  };
  handleScroll = event => {
    const { loadParams, updatePageIndex } = this.props;
    const { isEdit, currentTab } = this.state;
    const { clientHeight, scrollHeight, scrollTop, className } = event.target;
    const targetVlaue = scrollHeight - clientHeight - 30;
    const { loading, isMore, pageIndex } = loadParams;
    if (isEdit || !className.includes('processRecordScroll')) {
      return;
    }
    if (targetVlaue <= scrollTop && currentTab.value && !loading && isMore) {
      updatePageIndex(pageIndex + 1);
    }
    const tabsEl = document.querySelector('.tabsWrapper');
    const fixedTabsEl = document.querySelector('.fixedTabs');
    if (tabsEl && tabsEl.offsetTop <= scrollTop) {
      fixedTabsEl && fixedTabsEl.classList.remove('hide');
    } else {
      fixedTabsEl && fixedTabsEl.classList.add('hide');
    }
  };
  renderActionSheet() {
    const { params } = this.props.match;
    const { instance, rowId, worksheetId, sheetRow } = this.state;

    return (
      <Operation
        visible={this.state.operationVisible}
        rowId={rowId}
        worksheetId={worksheetId}
        instance={instance}
        sheetRow={sheetRow}
        onClose={() => {
          this.setState({ operationVisible: false });
        }}
        onUpdateAction={info => {
          this.setState(info);
        }}
        ref={this.operrationRef}
      />
    );
  }
  renderProcessHandle() {
    const { instance, submitLoading, submitAction, isHasten } = this.state;
    const { operationTypeList, btnMap = {}, works } = instance;
    const actionList = operationTypeList[0];
    const newOperationTypeList = operationTypeList[1].filter(item => item !== 12);
    const buttons = newOperationTypeList.map(item => {
      return OPERATION_LIST[item];
    });
    const allowUrgeWork = _.find(works, { allowUrge: true }) || {};
    return (
      <div className="footerHandle flexRow">
        {buttons.map((item, index) => (
          <div
            key={index}
            className="flexColumn optionBtn bold"
            onClick={() => {
              if (this.operrationRef.current) {
                this.operrationRef.current.handleOperation(index);
              }
            }}
          >
            <div>
              <Icon icon={item.icon} className="Font20" />
            </div>
            <div className="Font12">{item.text}</div>
          </div>
        ))}
        <div className="flexRow flex">
          {allowUrgeWork.allowUrge && (
            <div
              className="headerBtn pointer flex bold hasten"
              onClick={() => {
                if (!isHasten) {
                  this.setState({ isHasten: true });
                  operation({ id: allowUrgeWork.instanceId, operationType: 18 });
                }
              }}
            >
              {isHasten ? _l('已催办') : _l('催办')}
            </div>
          )}
          {actionList.map((item, index) => {
            let { id, text } = ACTION_LIST[item];
            return (
              <div
                key={id}
                className={cx('headerBtn pointer flex bold', id, { disable: submitLoading && submitAction === id })}
                onClick={() => {
                  this.handleFooterBtnClick(id);
                }}
              >
                {submitLoading && submitAction === id ? (
                  _l('提交中...')
                ) : (
                  <Fragment>
                    {/* {id === 'pass' || id === 'submit' || id === 'revoke' ? <Icon icon="plus-interest" /> : null}
                    {id === 'overrule' ? <Icon icon="closeelement-bg-circle" /> : null} */}
                    <span>{btnMap[item] || text}</span>
                  </Fragment>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  navigateTo = url => {
    url = (window.subPath || '') + url;

    if (window.isPublicApp && !new URL('http://z.z' + url).hash) {
      url = url + '#publicapp' + window.publicAppAuthorization;
    }
    this.props.history.push(url);
  };
  renderRecordHandle() {
    const { sheetRow, rowId, worksheetId, viewId, customBtns, isEdit, currentTab } = this.state;
    let copyCustomBtns = _.cloneDeep(customBtns);
    let showBtnsOut =
      copyCustomBtns.length && copyCustomBtns.length >= 2
        ? customBtns.slice(0, 2)
        : copyCustomBtns.length
        ? copyCustomBtns
        : [];

    if (currentTab.id) {
      return <RelationAction controlId={currentTab.id} />;
    }

    return (
      <Fragment>
        <div className="footerHandle btnsWrapper flexRow">
          {isEdit ? (
            <Fragment>
              <WingBlank className="flex" size="sm">
                <Button
                  className="Font13 bold Gray_75"
                  onClick={() => {
                    const { sheetRow, originalData } = this.state;
                    this.setState({
                      isEdit: false,
                      random: Date.now(),
                      sheetRow: {
                        ...sheetRow,
                        receiveControls: originalData,
                      },
                    });
                  }}
                >
                  <span>{_l('取消')}</span>
                </Button>
              </WingBlank>
              <WingBlank className="flex" size="sm">
                <Button
                  type="primary"
                  className="Font13 bold"
                  onClick={() => {
                    this.handleSave(() => {
                      this.loadCustomBtns();
                    });
                  }}
                >
                  {_l('保存')}
                </Button>
              </WingBlank>
            </Fragment>
          ) : (
            <Fragment>
              {sheetRow.allowEdit && (
                <WingBlank className="flex mLeft6 mRight6" size="sm">
                  <Button
                    className="Font13 edit letterSpacing"
                    onClick={() => {
                      this.setState({ isEdit: true, random: Date.now() });
                    }}
                  >
                    <Icon icon="workflow_write" className="Font15 mRight7" />
                    <span>{_l('编辑')}</span>
                  </Button>
                </WingBlank>
              )}
              {showBtnsOut.map(item => {
                let disabled =
                  (this.recordRef.current && this.recordRef.current.state.btnDisable[item.btnId]) || item.disabled;
                return (
                  <WingBlank className="flex flexShink mLeft6 mRight6" size="sm" key={item.btnId}>
                    <Button
                      className={cx('Font13 optBtn', 'bold', { disabled })}
                      style={
                        disabled
                          ? {}
                          : {
                              backgroundColor: item.color,
                              color: '#fff',
                              maxWidth: sheetRow.allowEdit && showBtnsOut.length === 2 ? '98px' : 'unset',
                            }
                      }
                      onClick={() => {
                        if (disabled) {
                          return;
                        }
                        if (this.recordRef.current) {
                          this.recordRef.current.handleTriggerCustomBtn(item);
                        }
                      }}
                    >
                      <Icon
                        icon={item.icon || 'custom_actions'}
                        className={cx('Font15 mRight7', { opcIcon: !item.icon && !disabled })}
                      />
                      <span>{item.name}</span>
                    </Button>
                  </WingBlank>
                );
              })}
              {!_.isEmpty(customBtns) && customBtns.length > 2 && (
                <div
                  className="moreOperation Font12 bold"
                  onClick={() => {
                    this.setState({ recordActionVisible: true });
                  }}
                >
                  <Icon icon="expand_less" className="Font20" />
                </div>
              )}
            </Fragment>
          )}
        </div>
        <RecordAction
          rowId={rowId}
          worksheetId={worksheetId}
          viewId={viewId}
          sheetRow={sheetRow}
          customBtns={customBtns}
          loadRow={this.loadRow}
          loadCustomBtns={this.loadCustomBtns}
          recordActionVisible={this.state.recordActionVisible}
          hideRecordActionVisible={() => {
            this.setState({ recordActionVisible: false });
          }}
          navigateTo={this.navigateTo}
          ref={this.recordRef}
        />
      </Fragment>
    );
  }
  renderErrorContent() {
    return (
      <Fragment>
        <div className="workflowStepListWrapper flexRow valignWrapper justifyCenter Font15">
          {_l('流程已关闭或删除')}
        </div>
        <Back
          className="low"
          onClick={() => {
            history.back();
          }}
        />
      </Fragment>
    );
  }
  renderCustomFields() {
    const { viewId, isEdit, random, sheetRow, rowId, worksheetId, instance, otherActionVisible } = this.state;
    const { operationTypeList, flowNode, app } = instance;
    const { type } = flowNode;
    return (
      <Fragment>
        <div className="flex">
          <CustomFields
            from={6}
            flag={random.toString()}
            appId={app.id}
            ref={this.customwidget}
            projectId={sheetRow.projectId}
            disabled={sheetRow.allowEdit ? !_.isEmpty(viewId) && !isEdit : false}
            recordCreateTime={sheetRow.createTime}
            recordId={rowId}
            worksheetId={worksheetId}
            data={sheetRow.receiveControls}
            onChange={() => {
              this.setState({ isEdit: true });
            }}
            openRelateSheet={(appId, worksheetId, rowId) => {
              this.props.history.push(`${window.subPath || ''}/mobile/record/${appId}/${worksheetId}/null/${rowId}`);
            }}
          />
        </div>
        {otherActionVisible && (
          <OtherAction
            visible={otherActionVisible}
            action={this.state.action}
            selectedUser={this.state.selectedUser}
            instance={instance}
            onAction={this.handleAction}
            onHide={() => {
              this.setState({
                otherActionVisible: false,
              });
            }}
          />
        )}
      </Fragment>
    );
  }
  renderTabContent = tab => {
    const { rowId, worksheetId, instance } = this.state;
    const { flowNode } = instance;
    const { params } = this.props.match;
    if (tab.id) {
      const props = {
        controlId: tab.id,
        workId: params.workId,
        instanceId: params.instanceId,
        rowId,
        worksheetId,
      };
      return (
        <div className="flexColumn h100">
          <RelationList {...props} />
        </div>
      );
    } else {
      return <div className="flexColumn h100">{this.renderCustomFields()}</div>;
    }
  };
  renderTabs(tabs, isRenderContent = true) {
    const { currentTab } = this.state;
    const index = currentTab.id ? _.findIndex(tabs, { id: currentTab.id }) : 0;
    return (
      <Tabs
        tabBarInactiveTextColor="#9e9e9e"
        tabs={tabs}
        page={index}
        swipeable={false}
        prerenderingSiblingsNumber={0}
        destroyInactiveTab={true}
        animated={false}
        renderTab={tab =>
          tab.value ? (
            <Fragment>
              <span className="tabName ellipsis mRight2">{tab.title}</span>
              <span>{`(${tab.value})`}</span>
            </Fragment>
          ) : (
            <span className="tabName ellipsis">{tab.title}</span>
          )
        }
        onChange={tab => {
          this.setState({
            currentTab: tab,
          });
          this.props.reset();
        }}
      >
        {isRenderContent && this.renderTabContent}
      </Tabs>
    );
  }
  renderContent() {
    const { viewId, sheetRow, instance, rowId, worksheetId, currentTab, isEdit } = this.state;
    const { relationRow, base = {} } = this.props;
    const { appId } = base;
    const { operationTypeList, flowNode, backFlowNodes, app } = instance;
    const { name, type, appType } = flowNode;
    const newOperationTypeList = operationTypeList[1].filter(item => item !== 12);
    const action = ACTION_TYPES[type];
    const titleControl = _.find(sheetRow.receiveControls || [], control => control.attribute === 1);
    const defaultTitle = _l('未命名');
    const recordTitle = titleControl ? renderCellText(titleControl) || defaultTitle : defaultTitle;
    const recordMuster = sheetRow.receiveControls.filter(
      item => isRelateRecordTableControl(item) && controlState(item, 6).visible,
    );
    const tabs = [
      {
        title: _l('详情'),
        index: 0,
      },
    ].concat(
      recordMuster.map((item, index) => {
        const isCurrentTab = currentTab.id === item.controlId;
        const value = Number(item.value);
        const newValue = isCurrentTab ? relationRow.count || value : value;
        if (isCurrentTab) {
          item.value = newValue;
        }
        return {
          id: item.controlId,
          title: item.controlName,
          value: newValue,
          index: index + 1,
        };
      }),
    );
    return (
      <Drawer
        className="workflowStepListWrapper"
        position="right"
        sidebar={<Sidebar instance={instance} onOpenChange={this.handleOpenChange} />}
        open={this.state.open}
        onOpenChange={this.handleOpenChange}
      >
        <div className="flexColumn flex processRecordScroll" onScroll={this.handleScroll}>
          {!isEdit && (
            <Fragment>
              <div className="header">
                <div className="flexRow valignWrapper">
                  <div className="flex">
                    <div
                      className={cx(
                        'sheetName',
                        action.id,
                        typeof action.icon === 'string' ? '' : action.icon[appType],
                      )}
                    >
                      <Icon
                        icon={typeof action.icon === 'string' ? action.icon : action.icon[appType]}
                        className="Font18"
                      />
                      <span>{name}</span>
                    </div>
                  </div>
                  <Icon icon="workflow" className="Font20 mRight10" onClick={this.handleOpenChange} />
                </div>
              </div>
              <div className="title pLeft15 pRight15">
                <span className="value">{recordTitle}</span>
              </div>
            </Fragment>
          )}
          {recordMuster.length ? (
            <div className={cx('processRecordViewTabs tabsWrapper flex', { edit: isEdit })}>
              {this.renderTabs(tabs)}
            </div>
          ) : (
            <div className="flexColumn flex">{this.renderCustomFields()}</div>
          )}
        </div>
        {!_.isEmpty(recordMuster) && !isEdit && (
          <div className="fixedTabs processRecordViewTabs Fixed w100 hide">{this.renderTabs(tabs, false)}</div>
        )}
        {_.isEmpty(operationTypeList[0])
          ? viewId && this.renderRecordHandle()
          : _.isEmpty(currentTab.id) && this.renderProcessHandle()}
        <Back
          onClick={() => {
            history.back();
          }}
          style={{ bottom: '105px' }}
        />
        {(!_.isEmpty(newOperationTypeList) || !(isWxWork || isWeLink)) && (
          <ChatCount
            worksheetId={worksheetId}
            rowId={rowId}
            appId={(this.props.base && this.props.base.appId) || ''}
            onClick={() => {
              this.props.history.push(`/mobile/discuss/${appId}/${worksheetId}/null/${rowId}?processRecord`);
            }}
          />
        )}
        {this.renderActionSheet()}
      </Drawer>
    );
  }
  render() {
    const { loading, isError } = this.state;
    return (
      <div className="sheetProcessRowRecord">
        {loading ? (
          <Flex justify="center" align="center" className="h100">
            <ActivityIndicator size="large" />
          </Flex>
        ) : isError ? (
          this.renderErrorContent()
        ) : (
          this.renderContent()
        )}
      </div>
    );
  }
}

export default connect(
  state => ({
    ..._.pick(state.mobile, ['loadParams', 'relationRow', 'base']),
  }),
  dispatch => bindActionCreators({ ..._.pick(actions, ['updatePageIndex', 'reset']) }, dispatch),
)(ProcessRecord);
