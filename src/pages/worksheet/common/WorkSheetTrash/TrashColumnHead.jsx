import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Menu, MenuItem } from 'ming-ui';
import { fieldCanSort, getSortData } from 'worksheet/util';
import { CONTROL_FILTER_WHITELIST } from 'worksheet/common/WorkSheetFilter/enum';
import BaseColumnHead from 'worksheet/components/BaseColumnHead';

export default function ColumnHead(props) {
  const { selected, className, style, control, isAsc, isLast, changeSort, updateSheetColumnWidths, setFilter } = props;
  const itemType = control.type === 30 ? control.sourceControlType : control.type;
  const filterWhiteKeys = _.flatten(
    Object.keys(CONTROL_FILTER_WHITELIST).map(key => CONTROL_FILTER_WHITELIST[key].keys),
  );
  const canFilter = _.includes(filterWhiteKeys, itemType);
  const canSort = fieldCanSort(itemType);
  return (
    <BaseColumnHead
      className={className}
      style={style}
      control={control}
      showDropdown
      isLast={isLast}
      isAsc={isAsc}
      changeSort={changeSort}
      updateSheetColumnWidths={updateSheetColumnWidths}
      renderPopup={({ closeMenu }) => (
        <Menu className="worksheetColumnHeadMenu" style={{ width: 180 }} onClickAway={closeMenu}>
          {canSort &&
            getSortData(itemType, control).map(item => (
              <MenuItem
                key={item.value}
                onClick={() => {
                  changeSort(item.value === 2);
                  closeMenu();
                }}
              >
                <i className={cx('icon', item.value === 1 ? 'icon-descending-order2' : 'icon-ascending-order2')}></i>
                {item.text}
              </MenuItem>
            ))}

          {canFilter && !selected && (
            <MenuItem
              onClick={() => {
                setFilter(control);
                closeMenu();
              }}
            >
              <i className="icon icon-worksheet_filter"></i>
              {_l('筛选')}
            </MenuItem>
          )}
        </Menu>
      )}
    />
  );
}

ColumnHead.propTypes = {
  className: PropTypes.string,
  style: PropTypes.shape({}),
  isAsc: PropTypes.bool,
  isLast: PropTypes.bool,
  selected: PropTypes.bool,
  control: PropTypes.shape({
    controlId: PropTypes.any,
    sourceControlType: PropTypes.any,
    type: PropTypes.number,
  }),
  changeSort: PropTypes.func,
  setFilter: PropTypes.func,
  updateSheetColumnWidths: PropTypes.func,
};
