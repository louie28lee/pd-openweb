import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import userController from 'src/api/user';

import LoadDiv from 'ming-ui/components/LoadDiv';
import UserHead from 'src/pages/feed/components/userHead';
import Menu from 'ming-ui/components/Menu';
import MenuItem from 'ming-ui/components/MenuItem';
import Checkbox from 'ming-ui/components/Checkbox';

import withClickAway from 'ming-ui/decorators/withClickAway';
import createDecoratedComponent from 'ming-ui/decorators/createDecoratedComponent';
import { addToken } from 'src/util';
const ClickAwayable = createDecoratedComponent(withClickAway);

import 'pager';
import Confirm from 'confirm';
import './style.less';
import Empty from '../../common/TableEmpty';

export default class ResignList extends React.Component {
  static propTypes = {
    keywords: PropTypes.string,
    projectId: PropTypes.string.isRequired,
  };

  static defaultProps = {
    keywords: '',
  };

  constructor(props) {
    super();

    this.state = {
      pageIndex: 1,
      isLoading: false,
      list: null,
      allCount: null,
      selectedAccountIds: {},
      showMenu: false,
    };
  }

  componentDidMount() {
    this.fetchList();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.keywords !== this.props.keywords) {
      this.setState(
        {
          pageIndex: 1,
        },
        this.fetchList.bind(this),
      );
    }
  }

  componentDidUpdate() {
    const { allCount, pageIndex } = this.state;
    if (this.pager) {
      $(this.pager).Pager({
        pageIndex,
        pageSize: 20,
        count: allCount,
        changePage: pageIndex => {
          this.setState({ pageIndex }, this.fetchList.bind(this));
        },
      });
    }
  }

  componentWillUnmount() {
    this.abortRequest();
  }

  abortRequest() {
    if (this.ajax && this.ajax.state() === 'pending' && this.ajax.abort) {
      this.ajax.abort();
    }
  }

  fetchList(props = this.props) {
    const { projectId, keywords } = props;
    const { pageIndex } = this.state;

    this.abortRequest();

    this.setState({
      isLoading: true,
    });

    this.ajax = userController.getUserList({
      userStatus: 4,
      pageIndex,
      projectId,
      keywords,
      pageSize: 20,
    });

    return this.ajax.then(
      ({ list, allCount }) => {
        this.setState({
          list,
          allCount,
          isLoading: false,
        });
      },
      () => {
        this.setState({
          isLoading: false,
        });
      },
    );
  }

  exportList() {
    const { selectedAccountIds = {} } = this.state;
    const { projectId } = this.props;
    const accountIds = _.keys(selectedAccountIds).filter(id => selectedAccountIds[id]);
    if (!accountIds.length) {
      alert(_l('请选择用户导出'), 3);
      return;
    }

    var url = `${md.global.Config.AjaxApiUrl}download/exportProjectUserList`;
    var fromHtml = `<form id="downFile" target="_blank" action="${addToken(url)}" method="post">
    <input type="hidden" name="userStatus" value="4" />
    <input type="hidden" name="projectId" value="${projectId}" />
    <input type="hidden" name="accountIds" value="${accountIds.toString()}" />
    </form>
    `;
    $('body').append(fromHtml);
    $('#downFile').submit().remove();
  }

  recovery(accountId, fullName) {
    const { projectId } = this.props;
    Confirm({ content: _l('确定恢复[%0]权限吗？', fullName) }, () => {
      userController
        .recoveryUser({
          accountId,
          projectId,
        })
        .then(data => {
          if (data == 1) {
            this.fetchList();
            alert(_l('恢复成功'));
          } else if (data == 4) {
            alert(_l('当前用户数已超出人数限制'), 3, false);
          } else {
            alert(_l('恢复失败'), 2);
          }
        });
    });
  }

  renderList() {
    const { isLoading, list, selectedAccountIds } = this.state;
    if (isLoading) {
      return (
        <tr>
          <td colSpan="4">
            <LoadDiv className="mTop10" />
          </td>
        </tr>
      );
    }
    if (!list || !(list && list.length)) {
      const detail = {
        icon: 'icon-sp_assignment_turned_in_white',
        desc: _l('无数据'),
      };
      return <Empty detail={detail} />;
    }
    return (
      <React.Fragment>
        {_.map(list, (user, index) => (
          <tr className={classNames({ deepBg: index % 2 === 0 })} key={user.accountId}>
            <td className="tableCheck">
              <Checkbox
                className="mLeft5"
                checked={!!(selectedAccountIds && selectedAccountIds[user.accountId])}
                onClick={checked => {
                  this.setState(prevState => ({
                    selectedAccountIds: { ...prevState.selectedAccountIds, [user.accountId]: !checked },
                  }));
                }}
              />
            </td>
            <td className="pAll10 pLeft16 TxtMiddle tableUser overflow_ellipsis">
              <div className="flexRow userBox">
                <UserHead
                  className="mLeft10 mRight10 InlineBlock TxtMiddle"
                  user={{ ...user, userHead: user.avatar }}
                  size={40}
                  lazy={'false'}
                />
                <div className="flexColumn userRight TxtLeft wMax100">
                  <a className="Bold overflow_ellipsis wMax100" href={'/user_' + user.accountId} title={user.fullname}>
                    {user.fullname}
                  </a>
                  <span className="overflow_ellipsis wMax100" title={user.department}>
                    {user.department}
                  </span>
                  <span className="overflow_ellipsis wMax100" title={user.job}>
                    {user.job}
                  </span>
                </div>
              </div>
            </td>
            <td className="overflow_ellipsis tableWork">
              <span className="Gray" title={user.workSite}>
                {user.workSite || '-'}
              </span>
            </td>
            <td className="color_b tableDays">{moment().diff(moment(user.createTime), 'days')}</td>
            <td className="color_b tableDays">{user.updateTime === '0001-01-01 00:00:00' ? '-' : user.updateTime}</td>
            <td className="tableOptions">
              <span
                className="ThemeColor3 Hand adminHoverColor"
                onClick={() => {
                  this.recovery(user.accountId, user.fullname);
                }}
              >
                {_l('恢复权限')}
              </span>
            </td>
          </tr>
        ))}
      </React.Fragment>
    );
  }

  renderContent() {
    const { allCount, isLoading, list, selectedAccountIds = {}, showMenu } = this.state;
    const accountIds = _.keys(selectedAccountIds).filter(id => selectedAccountIds[id]);

    const isAllChecked = !!(
      _.isArray(list) &&
      list.length &&
      _.every(list, user => selectedAccountIds[user.accountId])
    );

    return (
      <React.Fragment>
        <div className="pBottom8 pLeft16 clearfix Relative resignTool">
          {!accountIds.length ? (
            <div className="flexColumn Gray">
              <span>{_l('已离职用户，不能通过重新邀请加入网络')}</span>
              <span>{_l('如需要重新加入，可以在这里恢复权限')}</span>
            </div>
          ) : (
            <div className="flexRow">
              <span className="Gray Font15 Bold LineHeight30">{_l('已选择 %0 条', accountIds.length)}</span>
              <span className="Hand ThemeColor3 LineHeight30 InlineBlock Relative adminHoverColor">
                <span className="icon-download Font16 mLeft24 TxtMiddle" />
                <span className="TxtMiddle" onClick={() => this.exportList()}>
                  {_l('导出选中用户')}
                </span>
              </span>
            </div>
          )}
        </div>
        <table className="w100" cellSpacing="0">
          <thead>
            <tr>
              <th className="tableCheck">
                <Checkbox
                  className="mLeft5"
                  checked={isAllChecked}
                  onClick={checked => {
                    _.isArray(list) &&
                      _.each(list, user => {
                        this.setState(prevState => ({
                          selectedAccountIds: { ...prevState.selectedAccountIds, [user.accountId]: !checked },
                        }));
                      });
                  }}
                />
              </th>
              <th className="TxtLeft tableUser">
                <span className="TxtMiddle">{_l('姓名')}</span>
              </th>
              <th className="TxtLeft tableWork">{_l('工作地点')}</th>
              <th className="TxtLeft tableDays">{_l('加入天数')}</th>
              <th className="TxtLeft tableDays">{_l('离职时间')}</th>
              <th className="tableOptions">{_l('操作')}</th>
            </tr>
          </thead>
        </table>
        <div className="resignlistTable Relative">
          <table className="w100">
            <tbody>{this.renderList()}</tbody>
          </table>
        </div>
        {!isLoading && allCount && allCount > 10 ? (
          <div
            ref={el => {
              this.pager = el;
            }}
          />
        ) : null}
      </React.Fragment>
    );
  }

  render() {
    return <div className="pTop20 mLeft24 mRight24 resignList">{this.renderContent()}</div>;
  }
}
