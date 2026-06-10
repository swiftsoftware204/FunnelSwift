'use client';

import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SystemTagProps {
  name: string;
  className?: string;
}

// System tags that cannot be deleted
const SYSTEM_TAGS = [
  'ada-lead-magnet',
  'ada-widget-sent',
  'missedcall-demo-request',
  'missedcall-demo-active',
  'workflowswift-trial',
  'workflowswift-active',
  'hot-lead',
  'priority-follow-up',
  'demo-completed',
  'contract-sent',
  'closed-won',
  'closed-lost',
];

export function Tag({ name, className }: SystemTagProps) {
  const isSystem = SYSTEM_TAGS.includes(name);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isSystem ? 'default' : 'secondary'}
            className={`
              ${isSystem 
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30' 
                : 'bg-[#2A2D38] text-[#94A3B8] hover:bg-[#3A3D48] border-[#2A2D38]'
              }
              cursor-default
              ${className}
            `}
          >
            {name}
            {isSystem && (
              <Lock className="h-3 w-3 ml-1 inline" />
            )}
          </Badge>
        </TooltipTrigger>
        {isSystem && (
          <TooltipContent>
            <p>System tag - cannot be deleted</p>
            <p className="text-xs text-muted-foreground">
              Auto-triggers integrations
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// Export the list for use elsewhere
export { SYSTEM_TAGS };
