import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { autobind } from 'core-decorators';
import cx from 'classnames';
import 'dialogSelectUser';
import UserHead from 'src/pages/feed/components/userHead';
import { getTabTypeBySelectUser } from 'src/pages/worksheet/common/WorkSheetFilter/util';

export default class Users extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    projectId: PropTypes.string,
    onChange: PropTypes.func,
    originValues: PropTypes.arrayOf(PropTypes.string),
    from: PropTypes.string, // rule显示规则不出现 当前用户 当前用户的下属 未指定
  };
  static defaultProps = {
    originValues: [],
  };
  constructor(props) {
    super(props);
    this.state = {
      users: (props.originValues || [])
        .map(value => {
          let user = {};
          try {
            user = JSON.parse(value);
          } catch (err) {
            return undefined;
          }
          return {
            accountId: user.id,
            fullname: user.name,
            avatar: user.avatar,
          };
        })
        .filter(_.identity),
    };
  }
  selectUser(title, projectId, options, callback) {
    $().dialogSelectUser({
      title,
      sourceId: 0,
      fromType: 0,
      showMoreInvite: false,
      SelectUserSettings: Object.assign(
        {},
        {
          projectId: _.find(md.global.Account.projects, p => p.projectId === projectId) ? projectId : '',
          callback,
        },
        options,
      ),
    });
  }
  @autobind
  addUser() {
    const { projectId, from = '', control = {}, appId } = this.props;
    const tabType = getTabTypeBySelectUser(control);
    const _this = this;
    if (this.props.disabled) {
      return;
    }
    $(this.userscon).quickSelectUser({
      showQuickInvite: false,
      showMoreInvite: false,
      isTask: false,
      includeUndefinedAndMySelf: from !== 'rule',
      includeSystemField: from !== 'rule' && from !== 'subTotal',
      tabType,
      offset: {
        top: 0,
        left: 1,
      },
      zIndex: 10001,
      appId,
      filterAccountIds: from === 'rule' || from === 'subTotal' ? [] : [md.global.Account.accountId],
      SelectUserSettings: {
        projectId,
        callback(users) {
          _this.addUsers(users);
        },
      },
      selectCb(users) {
        _this.addUsers(users);
      },
    });
  }
  @autobind
  addUsers(selectusers) {
    const { users } = this.state;
    const newUsers = users.concat(selectusers);
    if (!selectusers[0] || _.find(users, option => option.accountId === selectusers[0].accountId)) {
      alert(_l('该用户已存在'), 3);
      return;
    }
    this.changeUsers(newUsers);
  }
  @autobind
  removeUser(user) {
    const newUsers = this.state.users.filter(u => u.accountId !== user.accountId);
    this.changeUsers(newUsers);
  }
  changeUsers = newUsers => {
    const { onChange } = this.props;
    this.setState(
      {
        users: newUsers,
      },
      () => {
        let users = newUsers
          .map(user => ({
            id: user.accountId,
            name: user.fullname,
            avatar: user.avatar,
          }))
          .map(v => JSON.stringify(v));
        onChange({
          values: newUsers.map(user => user.accountId),
          fullValues: users,
        });
      },
    );
  };
  renderHead(user) {
    if (user.accountId === 'user-self') {
      return (
        <span className="iconCon">
          <i className="icon icon-self filterCustomUserHead"></i>
        </span>
      );
    } else if (user.accountId === 'user-sub') {
      return (
        <span className="iconCon">
          <i className="icon icon-framework filterCustomUserHead"></i>
        </span>
      );
    } else {
      return (
        <UserHead
          className="userHead"
          alwaysBindCard
          user={{
            userHead: user.avatar,
            accountId: user.accountId,
          }}
          size={24}
        />
      );
    }
  }
  render() {
    const { disabled } = this.props;
    const { users } = this.state;
    return (
      <div className="worksheetFilterUsersCondition">
        <div className={cx('usersCon', { disabled })} ref={con => (this.userscon = con)} onClick={this.addUser}>
          {users.length ? (
            users.map((user, index) => (
              <div className="userItem" key={index}>
                {this.renderHead(user)}
                <span className="fullname">{user.fullname}</span>
                <span
                  className="remove"
                  onClick={e => {
                    e.stopPropagation();
                    this.removeUser(user);
                  }}
                >
                  <i className="icon icon-delete"></i>
                </span>
              </div>
            ))
          ) : (
            <span className="placeholder">{_l('请选择')}</span>
          )}
        </div>
      </div>
    );
  }
}
