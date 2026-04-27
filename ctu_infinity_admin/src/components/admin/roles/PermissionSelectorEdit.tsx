'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PermissionModule, IPermissionn } from '@/types/permission.type';
import clsx from 'clsx';

export default function PermissionSelectorEdit({
  listPermissions,
  value,
  onChange,
}: {
  listPermissions: PermissionModule[] | null;
  value: string[];
  onChange: (selected: string[]) => void;
}) {
  const selected = value || [];

  const togglePermission = (id: string) => {
    const updated = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];

    onChange(updated);
  };

  const toggleModule = (permissions: IPermissionn[], enable: boolean) => {
    const ids = permissions.map((p) => p.permissionId);

    const updated = enable
      ? Array.from(new Set([...selected, ...ids]))
      : selected.filter((x) => !ids.includes(x));

    onChange(updated);
  };

  if (!listPermissions) return null;

  return (
    <div className="mt-6 min-w-[720px]">
      <Label className="text-base font-semibold">Quyền hạn</Label>

      <Accordion type="multiple" className="mt-4 space-y-3">
        {listPermissions.map((module) => {
          const allIds = module.permissions.map((p) => p.permissionId);
          const isAllChecked = allIds.every((id) => selected.includes(id));

          return (
            <AccordionItem
              key={module.module}
              value={module.module}
              className="border rounded-md"
            >
              <div className="flex items-center justify-between w-full border rounded-md">
                <AccordionTrigger className="px-4 hover:no-underline flex-1 text-left cursor-pointer">
                  <span className="font-semibold">{module.module}</span>
                </AccordionTrigger>

                <div className="px-4" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={isAllChecked}
                    onCheckedChange={(v) => toggleModule(module.permissions, v)}
                    className="data-[state=checked]:bg-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 p-4 gap-6">
                  {module.permissions.map((item) => (
                    <div
                      key={item.permissionId}
                      className="border rounded-md p-3 flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {item.name}
                        </p>

                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded text-white text-xs font-semibold',
                              item.method === 'GET' && 'bg-blue-500',
                              item.method === 'POST' && 'bg-green-500',
                              item.method === 'DELETE' && 'bg-red-500',
                              item.method === 'PATCH' && 'bg-yellow-500',
                              item.method === 'PUT' && 'bg-purple-500'
                            )}
                          >
                            {item.method}
                          </span>
                          <span className="truncate">{item.apiPath}</span>
                        </p>
                      </div>

                      <Switch
                        checked={selected.includes(item.permissionId)}
                        onCheckedChange={() =>
                          togglePermission(item.permissionId)
                        }
                        className="data-[state=checked]:bg-blue-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
