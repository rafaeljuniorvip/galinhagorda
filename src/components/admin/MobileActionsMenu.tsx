'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ActionItem {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default';
  disabled?: boolean;
}

interface MobileActionsMenuProps {
  actions: ActionItem[];
}

export default function MobileActionsMenu({ actions }: MobileActionsMenuProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="flex justify-end">
        {actions.map((action, i) => {
          const colorClass = action.color === 'error'
            ? 'text-destructive hover:text-destructive'
            : action.color === 'primary'
              ? 'text-primary hover:text-primary'
              : 'text-muted-foreground hover:text-foreground';

          const content = (
            <button
              key={i}
              className={cn('p-1.5 rounded hover:bg-accent transition-colors', colorClass)}
              onClick={action.onClick}
              title={action.label}
              disabled={action.disabled}
            >
              {action.icon}
            </button>
          );

          if (action.href) {
            return (
              <Link key={i} href={action.href} className={cn('p-1.5 rounded hover:bg-accent transition-colors', colorClass)} title={action.label}>
                {action.icon}
              </Link>
            );
          }

          return content;
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded hover:bg-accent">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, i) => {
          const colorClass = action.color === 'error' ? 'text-destructive' : '';
          if (action.href) {
            return (
              <DropdownMenuItem key={i} asChild disabled={action.disabled} className={colorClass}>
                <Link href={action.href}>
                  <span className="mr-2">{action.icon}</span>
                  {action.label}
                </Link>
              </DropdownMenuItem>
            );
          }
          return (
            <DropdownMenuItem
              key={i}
              onClick={action.onClick}
              disabled={action.disabled}
              className={colorClass}
            >
              <span className="mr-2">{action.icon}</span>
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
