import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Icon, Checkbox, LoadDiv, Dropdown, Radio, Support, ScrollView, Switch } from 'ming-ui';
import './index.less';
import process from '../../api/process';
import SelectWorkflow from '../../components/SelectWorkflow';
import { updatePublishState } from '../../redux/actions';
import { NODE_TYPE } from '../enum';
import Member from '../Detail/components/Member';
import SelectUserDropDown from '../Detail/components/SelectUserDropDown';
import ProcessVariables from './components/ProcessVariables';
import cx from 'classnames';
import copy from 'copy-to-clipboard';
import SetControlName from './components/SetControlName';

const TRIGGER_TYPE = {
  ALLOW: 0,
  ONLY_WORKFLOW: 1,
  NO_ALLOW: 2,
};

class ProcessConfig extends Component {
  state = {
    data: {},
    showWorkflow: false,
    showSelectUserDialog: false,
    tab: 1,
    errorItems: {},
  };

  componentDidMount() {
    const { flowInfo } = this.props;

    process.getProcessConfig({ processId: flowInfo.id }).then(data => {
      this.setState({ data });
    });
  }

  /**
   * 更新data数据
   */
  updateSource = (obj, callback = () => {}) => {
    this.setState({ data: Object.assign({}, this.state.data, obj) }, callback);
  };

  /**
   * 保存
   */
  onSave = () => {
    const { flowInfo } = this.props;
    const { data, saveRequest, errorItems } = this.state;
    const {
      executeType,
      allowRevoke,
      revokeNodeIds,
      errorNotifiers,
      errorInterval,
      triggerType,
      processNames,
      startEventPass,
      userTaskPass,
      userTaskNullPass,
      sendTaskPass,
      processVariables,
      allowUrge,
      pbcConfig,
    } = data;

    if (_.find(errorItems, o => o)) {
      alert(_l('有参数配置错误'), 2);
      return;
    }

    if (processVariables.filter(item => !item.controlName).length) {
      alert(_l('参数名称不能为空'), 2);
      return;
    }

    if (saveRequest) {
      return;
    }

    process
      .saveProcessConfig({
        processId: flowInfo.id,
        executeType,
        allowRevoke,
        revokeNodeIds: allowRevoke ? revokeNodeIds : [],
        errorNotifiers,
        errorInterval,
        triggerType,
        processIds: data.triggerType === TRIGGER_TYPE.ONLY_WORKFLOW ? processNames.map(item => item.id) : [],
        startEventPass,
        userTaskPass,
        userTaskNullPass,
        sendTaskPass,
        processVariables,
        allowUrge,
        pbcConfig,
      })
      .then(result => {
        if (result) {
          alert(_l('保存成功'));

          if (flowInfo.publish) {
            this.props.dispatch(updatePublishState({ publishStatus: 1, pending: true }));
          }
        }
        this.updateSource({ processVariables: result });
        this.setState({ saveRequest: false });
      });

    this.setState({ saveRequest: true });
  };

  /**
   * 选择工作流
   */
  selectProcess = selectItems => {
    const { data } = this.state;
    const newProcessNames = _.cloneDeep(data.processNames);
    const ids = newProcessNames.map(item => item.id);

    selectItems.forEach(item => {
      if (!_.includes(ids, item.id)) {
        newProcessNames.push(item);
      }
    });

    this.updateSource({ processNames: newProcessNames });
  };

  /**
   * 删除工作流
   */
  deleteProcess(id) {
    const { data } = this.state;
    const processNames = _.cloneDeep(data.processNames);

    _.remove(processNames, o => o.id === id);
    this.updateSource({ processNames });
  }

  renderProcessContent() {
    const { flowInfo } = this.props;
    const { data, showSelectUserDialog, showWorkflow } = this.state;
    const dateArr = [
      { text: _l('始终通知'), value: 0 },
      { text: _l('15分钟'), value: 15 },
      { text: _l('1小时'), value: 60 },
      { text: _l('2小时'), value: 120 },
      { text: _l('6小时'), value: 360 },
      { text: _l('12小时'), value: 720 },
      { text: _l('24小时'), value: 1440 },
    ];
    const operationMode = [
      {
        text: _l('并行（默认）'),
        value: 1,
        desc: _l('数据各自同步执行，适合运行实例间互不影响的流程。执行速度快，适合大多数流程使用'),
      },
      {
        text: _l('串行'),
        value: 2,
        desc: _l('数据按顺序逐条执行，适合运行实例间互相影响的流程。数据量大时执行速度缓慢，有时效性要求时请慎用！'),
      },
    ];

    return (
      <Fragment>
        <div className="bold Font16 mTop20">{_l('运行方式')}</div>
        <div className="Gray_75 mTop5">{_l('设置流程的运行方式，仅支持新增记录触发，自定义动作触发的流程')}</div>
        {operationMode.map((item, i) => (
          <Fragment key={i}>
            <div className="mTop15">
              <Radio
                className="bold"
                text={item.text}
                disabled={!data.sequence && item.value !== 1}
                checked={data.executeType === item.value}
                onClick={() => this.updateSource({ executeType: item.value })}
              />
            </div>
            <div className={cx('Font12 mTop5 mLeft30', !data.sequence && item.value !== 1 ? 'Gray_9e' : 'Gray_75')}>
              {item.desc}
            </div>
          </Fragment>
        ))}

        <div className="processConfigLine" />
        <div className="bold Font16 mTop20">{_l('系统错误通知')}</div>
        <div className="Gray_75 mTop5">{_l('如果因系统错误导致流程终止，以下人员将会收到通知')}</div>

        <Member
          type={NODE_TYPE.MESSAGE}
          accounts={data.errorNotifiers}
          updateSource={({ accounts }) => this.updateSource({ errorNotifiers: accounts })}
        />

        <div className="mTop15 relative">
          <div className="ThemeColor3 AddUserBtn" onClick={() => this.setState({ showSelectUserDialog: true })}>
            <i className="Font28 icon-task-add-member-circle mRight10" />
            {_l('添加通知人')}
          </div>

          <SelectUserDropDown
            visible={showSelectUserDialog}
            disabledNodeRole={true}
            appId={flowInfo.relationId}
            companyId={flowInfo.companyId}
            accounts={data.errorNotifiers}
            updateSource={({ accounts }) => this.updateSource({ errorNotifiers: accounts })}
            onClose={() => this.setState({ showSelectUserDialog: false })}
          />
        </div>
        <div className="mTop20 flexRow" style={{ alignItems: 'center' }}>
          <Dropdown
            style={{ width: 100 }}
            menuStyle={{ width: '100%' }}
            data={dateArr}
            value={data.errorInterval}
            border
            onChange={errorInterval => this.updateSource({ errorInterval })}
          />
          <div className="Gray_75 mLeft10">{_l('内不发送同类错误通知')}</div>
        </div>

        <div className="processConfigLine" />

        <div className="bold Font16 mTop20">{_l('触发其他工作流')}</div>
        <div className="mTop15">
          <Radio
            text={_l('允许触发')}
            checked={data.triggerType === TRIGGER_TYPE.ALLOW}
            onClick={() => this.updateSource({ triggerType: TRIGGER_TYPE.ALLOW })}
          />
        </div>
        <div className="Gray_75 Font12 mTop5 mLeft30">
          {_l('在选择此配置时，如果要触发本表的其他工作流，必须为目标流程指定触发字段')}
        </div>

        <div className="mTop15">
          <Radio
            text={_l('只能触发指定工作流')}
            checked={data.triggerType === TRIGGER_TYPE.ONLY_WORKFLOW}
            onClick={() => this.updateSource({ triggerType: TRIGGER_TYPE.ONLY_WORKFLOW })}
          />
        </div>
        {data.triggerType === TRIGGER_TYPE.ONLY_WORKFLOW && (
          <div className="processConfigFlow mTop5 mLeft30">
            <div>
              {data.processNames.map(item => {
                return (
                  <span key={item.id} className="processConfigItem">
                    <span
                      className="ellipsis InlineBlock"
                      style={{ maxWidth: 210 }}
                      onClick={() => window.open(`/workflowedit/${item.id}`)}
                    >
                      {flowInfo.relationId === item.relationId ? '' : `（${item.apkName}）`}
                      {item.name}
                    </span>
                    <Icon icon="close" className="mLeft5 Font14" onClick={() => this.deleteProcess(item.id)} />
                  </span>
                );
              })}
            </div>
            <span
              className="ThemeColor3 ThemeHoverColor2 pointer"
              onClick={() => this.setState({ showWorkflow: true })}
            >
              <Icon icon="add" className="mRight5 Font16" />
              {_l('选择工作流')}
            </span>
          </div>
        )}

        <div className="mTop15">
          <Radio
            text={_l('不允许触发')}
            checked={data.triggerType === TRIGGER_TYPE.NO_ALLOW}
            onClick={() => this.updateSource({ triggerType: TRIGGER_TYPE.NO_ALLOW })}
          />
        </div>

        <SelectWorkflow
          visible={showWorkflow}
          processId={flowInfo.id}
          relationId={flowInfo.relationId}
          onSave={this.selectProcess}
          onClose={() => this.setState({ showWorkflow: false })}
        />
      </Fragment>
    );
  }

  renderArtificialContent() {
    const { flowInfo } = this.props;
    const { data } = this.state;
    const isSheetOrButton = _.includes([1, 8], flowInfo.startAppType);
    const nodeSettings = [
      {
        text: _l('审批'),
        list: [
          {
            text: _l('工作流触发者自动通过'),
            checked: data.startEventPass,
            disabled: !isSheetOrButton,
            key: 'startEventPass',
          },
          { text: _l('审批人为空时自动通过'), checked: data.userTaskNullPass, key: 'userTaskNullPass' },
          { text: _l('已经审批过该对象的审批人自动通过'), checked: data.userTaskPass, key: 'userTaskPass' },
        ],
      },
      {
        text: _l('通知'),
        list: [{ text: _l('工作流触发者不发送通知'), checked: data.sendTaskPass, key: 'sendTaskPass' }],
      },
    ];
    const list = data.revokeFlowNodes.map(item => {
      return {
        text: item.name,
        value: item.id,
      };
    });

    if (data.revokeNodeIds[0]) {
      list.unshift({ text: _l('清除选择'), value: '' });
    }

    return (
      <Fragment>
        <div className="bold Font16 mTop20">{_l('工作流撤回')}</div>
        <div className="mTop15">
          <Checkbox
            className="InlineFlex TxtTop"
            text={_l('允许触发者撤回')}
            checked={data.allowRevoke}
            disabled={!isSheetOrButton}
            onClick={checked => this.updateSource({ allowRevoke: !checked })}
          />
          {data.allowRevoke && (
            <div className="mTop10 mLeft25 flexRow" style={{ alignItems: 'center' }}>
              <div>{_l('节点')}</div>
              <Dropdown
                className="mLeft10"
                style={{ width: 220 }}
                menuStyle={{ width: '100%' }}
                data={list}
                value={data.revokeNodeIds[0] || undefined}
                border
                onChange={revokeNodeId => this.updateSource({ revokeNodeIds: revokeNodeId ? [revokeNodeId] : [] })}
              />
              <div className="mLeft10 flex">{_l('通过后不允许撤回')}</div>
            </div>
          )}
        </div>
        <div className="mTop15">
          <Checkbox
            className="InlineFlex TxtTop"
            text={_l('允许触发者催办')}
            checked={data.allowUrge}
            disabled={!isSheetOrButton}
            onClick={checked => this.updateSource({ allowUrge: !checked })}
          />
        </div>

        <div className="bold Font16 mTop20">{_l('人工节点设置')}</div>
        {nodeSettings.map((item, i) => {
          return (
            <Fragment key={i}>
              <div className="Font14 mTop10 Gray_75 bold">{item.text}</div>
              {item.list.map(o => {
                return (
                  <div className="mTop15" key={o.key}>
                    <Checkbox
                      {...o}
                      className="InlineFlex TxtTop"
                      onClick={checked => this.updateSource({ [o.key]: !checked })}
                    />
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </Fragment>
    );
  }

  renderParameterContent() {
    const { data, errorItems } = this.state;

    return (
      <Fragment>
        <div className="bold Font16 mTop20">{_l('参数对象')}</div>
        <div className="Gray_75 mTop5 mBottom15">
          {_l(
            '流程开始运行时生成，可以用以执行运算，或实现两个流程间的数据传递；命名时请以英文字母打头，名称中禁止出现汉字',
          )}
        </div>

        <ProcessVariables
          processVariables={data.processVariables}
          errorItems={errorItems}
          setErrorItems={errorItems => this.setState({ errorItems })}
          updateSource={this.updateSource}
        />
      </Fragment>
    );
  }

  renderPBCContent() {
    const { flowInfo } = this.props;
    const { data, errorItems } = this.state;
    const options = [
      {
        text: _l('通过回调地址接受返回参数'),
        value: 1,
        desc: _l('此时对方请求时必须附带参数callbackURL，我方流程运行结束后会向此URL传递输出参数'),
      },
      {
        text: _l('直接返回参数给请求地址（仅私有部署开放）'),
        value: 2,
      },
    ];

    return (
      <Fragment>
        <div className="Gray_9e mTop20">
          {_l('启用后，我们会自动为您的业务流程生成相关的API开发文档，供您向其他第三方外部系统提供平台开放能力')}
          {data.pbcConfig.enable && (
            <a
              href={`/worksheetapi/${flowInfo.relationId}`}
              target="_blank"
              className="mLeft2 ThemeColor3 ThemeHoverColor2"
            >
              {_l('查看文档')}
            </a>
          )}
        </div>

        <div className="mTop10">
          <Switch
            checked={data.pbcConfig.enable}
            text={data.pbcConfig.enable ? _l('开启') : _l('关闭')}
            onClick={() =>
              this.updateSource({ pbcConfig: Object.assign({}, data.pbcConfig, { enable: !data.pbcConfig.enable }) })
            }
          />
        </div>

        {data.pbcConfig.enable && (
          <Fragment>
            <SetControlName
              data={data.processVariables}
              errorItems={errorItems}
              setErrorItems={errorItems => this.setState({ errorItems })}
              updateSource={this.updateSource}
            />
            <div className="bold Font16 mTop20">{_l('请求地址')}</div>
            <div className="mTop5 Gray_9e">{_l('我们为您生成了一个用来接收请求的URL，可以在URL后自定义拼接内容')}</div>
            <div className="mTop10 flexRow">
              <input
                type="text"
                className="webhookLink flex"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                value={data.pbcConfig.url}
                disabled
              />
              <input
                type="text"
                className="webhookLinkCustom"
                value={data.pbcConfig.urlExtension}
                onChange={e =>
                  this.updateSource({ pbcConfig: Object.assign({}, data.pbcConfig, { urlExtension: e.target.value }) })
                }
                onBlur={e =>
                  this.updateSource({
                    pbcConfig: Object.assign({}, data.pbcConfig, { urlExtension: e.target.value.trim() }),
                  })
                }
              />
              <div
                className="mLeft10 webhookLinkCopy"
                onClick={() => {
                  copy(`${data.pbcConfig.url}/${data.pbcConfig.urlExtension}`.replace(/\/$/, ''));
                  alert(_l('已复制到剪切板'));
                }}
              >
                {_l('复制')}
              </div>
            </div>

            <div className="bold Font16 mTop20">{_l('返回参数')}</div>
            {options.map((item, i) => (
              <Fragment key={i}>
                <div className="mTop15">
                  <Radio
                    className="bold"
                    text={item.text}
                    disabled={!md.global.Config.IsLocal && item.value !== 1}
                    checked={data.pbcConfig.outType === item.value}
                    onClick={() =>
                      this.updateSource({ pbcConfig: Object.assign({}, data.pbcConfig, { outType: item.value }) })
                    }
                  />
                </div>
                {!!item.desc && (
                  <div
                    className={cx(
                      'Font12 mTop5 mLeft30',
                      !md.global.Config.IsLocal && item.value !== 1 ? 'Gray_9e' : 'Gray_75',
                    )}
                  >
                    {item.desc}
                  </div>
                )}
              </Fragment>
            ))}
          </Fragment>
        )}
      </Fragment>
    );
  }

  render() {
    const { flowInfo } = this.props;
    const isPBC = _.includes([17], flowInfo.startAppType);
    const { data, tab } = this.state;

    if (_.isEmpty(data)) {
      return <LoadDiv className="mTop15" />;
    }

    const settings = [
      { text: _l('基础'), value: 1, icon: 'department' },
      { text: _l('人工节点设置'), value: 2, icon: 'user_Review' },
      { text: _l('流程参数'), value: 3, icon: 'parameter' },
      { text: _l('平台API能力'), value: 4, icon: 'pbc' },
    ];
    const licenseType = _.get(
      _.find(md.global.Account.projects, item => item.projectId === flowInfo.companyId) || {},
      'licenseType',
    );

    if (!isPBC || licenseType === 0) {
      _.remove(settings, item => item.value === 4);
    }

    return (
      <ScrollView className="workflowHistoryWrap flex">
        <div className="processConfig">
          <ul className="processConfigTab">
            {settings.map(item => (
              <li
                className={item.value === tab ? 'active' : ''}
                key={item.value}
                onClick={() => this.setState({ tab: item.value })}
              >
                <Icon icon={item.icon} />
                {item.text}
              </li>
            ))}
          </ul>

          <div className="flexRow pLeft24 pRight24 pTop13 pBottom13 bold">
            <div className="Font15 flex">{settings.find(item => item.value === tab).text}</div>
            <Support
              className="pointer Gray_9e"
              href="https://help.mingdao.com/flow5.html"
              type={2}
              text={_l('帮助')}
            />
          </div>
          <div className="processConfigLine" style={{ margin: 0 }} />

          <div className="pLeft24 pRight24">
            {tab === 1 && this.renderProcessContent()}
            {tab === 2 && this.renderArtificialContent()}
            {tab === 3 && this.renderParameterContent()}
            {tab === 4 && this.renderPBCContent()}
            <div className="mTop50 TxtCenter">
              <span className="processConfigSave ThemeBGColor3 ThemeHoverBGColor2 pointer" onClick={this.onSave}>
                {_l('保存')}
              </span>
            </div>
          </div>
        </div>
      </ScrollView>
    );
  }
}

export default connect(state => state.workflow)(ProcessConfig);
