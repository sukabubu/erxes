import { useQuery, useMutation } from '@apollo/client';
import {
  Button,
  useToast,
  AlertDialog,
  RecordTable,
  Popover,
  Command,
  Combobox,
  RelativeDateDisplay,
  RecordTableInlineCell,
  Badge,
} from 'erxes-ui';
import { MembersInline } from 'ui-modules';
import { useParams, useNavigate } from 'react-router-dom';
import { templatesQuery } from '../graphql/queries';
import { templateRemoveMutation } from '../graphql/mutations';
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconDots,
  IconCalendar,
  IconUser,
  IconAlignLeft,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';

const TemplateRowActions = ({
  template,
  onEdit,
  onRemove,
}: {
  template: any;
  onEdit: (template: any) => void;
  onRemove: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <RecordTable.MoreButton className="w-full h-full" />
        </Popover.Trigger>
        <Popover.Content className="w-[200px] p-0">
          <Command shouldFilter={false}>
            <Command.List>
              <Command.Item
                value="edit"
                onSelect={() => {
                  setOpen(false);
                  onEdit(template);
                }}
              >
                <IconEdit className="mr-2 h-4 w-4" /> 编辑
              </Command.Item>
              <Command.Item
                value="delete"
                className="text-destructive"
                onSelect={() => {
                  setOpen(false);
                  setShowDeleteDialog(true);
                }}
              >
                <IconTrash className="mr-2 size-4" /> 删除
              </Command.Item>
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>删除模板？</AlertDialog.Title>
            <AlertDialog.Description>
              此操作无法撤销。
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>取消</AlertDialog.Cancel>
            <AlertDialog.Action onClick={() => onRemove(template._id)}>
              删除
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};

export const TemplateList = () => {
  const { id: teamId } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useQuery(templatesQuery, {
    variables: { teamId },
    skip: !teamId,
    fetchPolicy: 'network-only',
  });

  const [removeMutation] = useMutation(templateRemoveMutation, {
    refetchQueries: ['operationTemplates'],
  });
  const { toast } = useToast();

  const handleEdit = (template: any) => {
    navigate(
      `/settings/operation/team/templates/${teamId}/edit/${template._id}`,
    );
  };

  const handleRemove = (id: string) => {
    removeMutation({ variables: { _id: id } })
      .then(() => toast({ title: '模板已删除' }))
      .catch((e) => toast({ title: '错误', description: e.message }));
  };

  const handleAdd = () => {
    navigate(`/settings/operation/team/templates/${teamId}/template-new`);
  };

  const templates = data?.operationTemplates || [];

  const columns = useMemo<ColumnDef<any>[]>(
        () => [
          {
            id: 'name',
            accessorKey: 'name',
            header: () => (
          <RecordTable.InlineHead label="名称" icon={IconAlignLeft} />
            ),
        cell: ({ cell }) => (
          <Button asChild variant="ghost">
            <Badge
              variant="secondary"
              onClick={(e) => {
                handleEdit(cell.row.original);
              }}
            >
              {cell.getValue() as string}
            </Badge>
          </Button>
        ),
      },
          {
            id: 'createdAt',
            accessorKey: 'createdAt',
            header: () => (
          <RecordTable.InlineHead label="创建时间" icon={IconCalendar} />
            ),
        cell: ({ cell }) => {
          return (
            <RelativeDateDisplay value={cell.getValue() as string} asChild>
              <RecordTableInlineCell>
                <RelativeDateDisplay.Value value={cell.getValue() as string} />
              </RecordTableInlineCell>
            </RelativeDateDisplay>
          );
        },
      },
          {
            id: 'createdBy',
            accessorKey: 'createdBy',
            header: () => (
          <RecordTable.InlineHead label="创建人" icon={IconUser} />
            ),
        cell: ({ getValue }) => {
          const userId = getValue() as string;
          if (!userId) return '-';
          return (
            <RecordTableInlineCell>
              <MembersInline memberIds={[userId]} />
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'more',
        header: '',
        cell: ({ row }) => (
          <TemplateRowActions
            template={row.original}
            onEdit={handleEdit}
            onRemove={handleRemove}
          />
        ),
        size: 22,
      },
    ],
    [teamId],
  );

  return (
    <div className="p-6 h-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">模板</h2>
        <Button onClick={handleAdd}>
          <IconPlus className="mr-2 size-4" />
          新建模板
        </Button>
      </div>

      <RecordTable.Provider
        data={templates || []}
        stickyColumns={['more']}
        columns={columns}
      >
        <RecordTable>
          <RecordTable.Header />
          <RecordTable.Body>
            <RecordTable.RowList
              Row={(props) => (
                <RecordTable.Row
                  {...props}
                  className="cursor-pointer hover:bg-muted/50"
                />
              )}
            />
            {loading && <RecordTable.RowSkeleton rows={5} />}
            {templates.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground text-sm italic">
                未找到模板
              </div>
            )}
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.Provider>
    </div>
  );
};
