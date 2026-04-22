import { Button, DropdownMenu, Skeleton, useConfirm } from 'erxes-ui';
import { IconArrowLeft, IconDots, IconPlus } from '@tabler/icons-react';
import {
  dealCreateDefaultValuesState,
  dealCreateSheetState,
} from '@/deals/states/dealCreateSheetState';
import {
  useStagesEdit,
  useStagesRemove,
  useStagesSortItems,
} from '@/deals/stage/hooks/useStages';

import { BoardDealColumn } from '@/deals/types/boards';
import ItemProductProbabilities from './ItemProductProbabilities';
import { PrintDialog } from './common/Print';
import { useDealsArchive } from '@/deals/cards/hooks/useDeals';
import { useSetAtom } from 'jotai';
import { useState } from 'react';

type Props = {
  column: BoardDealColumn;
  loading: boolean;
  totalCount: number;
};

export const DealsBoardColumnHeader = ({
  column,
  loading,
  totalCount,
}: Props) => {
  const [showSortOptions, setShowSortOptions] = useState(false);
  const { archiveDeals } = useDealsArchive();
  const { removeStage } = useStagesRemove();
  const { editStage } = useStagesEdit();
  const { sortItems } = useStagesSortItems();
  const { confirm } = useConfirm();
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const { probability, name, _id, amount, unUsedAmount } = column;

  const handleArchiveStage = () => {
    confirm({
      message: '确定要归档此列表中的所有卡片吗？',
    }).then(() => {
      archiveDeals(_id);
    });
  };

  const handleArchiveList = () => {
    confirm({
      message: '确定要归档此列表吗？',
    }).then(() => {
      editStage({ variables: { _id, status: 'archived' } });
    });
  };

  const handleRemoveStage = () => {
    confirm({
      message: '确定要删除此阶段吗？',
    }).then(() => {
      removeStage({ variables: { _id } });
    });
  };

  const handleSortOptionClick = (sortType: string) => {
    const sortLabel =
      sortType === 'created-desc'
        ? '创建日期（最新优先）'
        : sortType === 'created-asc'
        ? '创建日期（最早优先）'
        : sortType === 'modified-desc'
        ? '修改日期（最新优先）'
        : sortType === 'modified-asc'
        ? '修改日期（最早优先）'
        : sortType === 'close-asc'
        ? '分配日期（最早优先）'
        : sortType === 'close-desc'
        ? '分配日期（最新优先）'
        : sortType === 'alphabetically-asc'
        ? '按字母顺序'
        : '';
    confirm({
      message: `确定要按${sortLabel}排序此列表吗？`,
    }).then(() => {
      const processId = Math.random().toString();
      localStorage.setItem('processId', processId);
      sortItems(_id, sortType, processId);
    });
    setShowSortOptions(false);
  };

  const SortMenu = () => (
    <>
      <DropdownMenu.Item
        onSelect={(e) => {
          e.preventDefault();
          setShowSortOptions(false);
        }}
      >
        <IconArrowLeft className="w-4 h-4 mr-2" />
        返回
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onClick={() => handleSortOptionClick('created-desc')}>
        创建日期（最新优先）
      </DropdownMenu.Item>
      <DropdownMenu.Item onClick={() => handleSortOptionClick('created-asc')}>
        创建日期（最早优先）
      </DropdownMenu.Item>
      <DropdownMenu.Item onClick={() => handleSortOptionClick('modified-desc')}>
        修改日期（最新优先）
      </DropdownMenu.Item>
      <DropdownMenu.Item onClick={() => handleSortOptionClick('modified-asc')}>
        修改日期（最早优先）
      </DropdownMenu.Item>
      <DropdownMenu.Item onClick={() => handleSortOptionClick('close-asc')}>
        分配日期（最早优先）
      </DropdownMenu.Item>
      <DropdownMenu.Item onClick={() => handleSortOptionClick('close-desc')}>
        分配日期（最新优先）
      </DropdownMenu.Item>
      <DropdownMenu.Item
        onClick={() => handleSortOptionClick('alphabetically-asc')}
      >
        按字母顺序
      </DropdownMenu.Item>
    </>
  );

  return (
    <div className="m-0 px-2 min-h-10 w-full font-semibold text-sm flex items-center justify-between flex-col">
      <div className="flex justify-between items-center w-full mt-1">
        <div>
          <h4 className="capitalize flex items-center gap-1 pl-1">
            {name}
            <span className="text-accent-foreground font-medium pl-1">
              {loading ? (
                <Skeleton className="size-4 rounded" />
              ) : (
                totalCount || 0
              )}
            </span>
          </h4>
        </div>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon" className="size-6 relative">
                <IconDots />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="w-56">
              {!showSortOptions ? (
                <>
                  <DropdownMenu.Label>阶段设置</DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Group>
                    <DropdownMenu.Item onClick={handleArchiveStage}>
                      归档此列表中的所有卡片
                      <DropdownMenu.Shortcut>⇧⌘A</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={handleArchiveList}>
                      归档此列表
                      <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={handleRemoveStage}>
                      删除阶段
                      <DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Group>
                    <DropdownMenu.Item
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowSortOptions(true);
                      }}
                    >
                      排序方式
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowPrintDialog(true);
                      }}
                    >
                      打印文档
                      <DropdownMenu.Shortcut>⌘T</DropdownMenu.Shortcut>
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                </>
              ) : (
                <SortMenu />
              )}
            </DropdownMenu.Content>
          </DropdownMenu>

          <DealCreateSheetTrigger stageId={column._id} />
        </div>
      </div>
      {showPrintDialog && (
        <PrintDialog
          open={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          stageId={column._id}
        />
      )}
      <ItemProductProbabilities
        totalAmount={amount as Record<string, number> | undefined}
        unusedTotalAmount={unUsedAmount as Record<string, number> | undefined}
        probability={probability}
      />
    </div>
  );
};

const DealCreateSheetTrigger = ({ stageId }: { stageId: string }) => {
  const setOpenCreateDeal = useSetAtom(dealCreateSheetState);
  const setDefaultValues = useSetAtom(dealCreateDefaultValuesState);

  const handleClick = () => {
    setDefaultValues({ stageId });
    setOpenCreateDeal(true);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleClick}>
      <IconPlus />
    </Button>
  );
};
