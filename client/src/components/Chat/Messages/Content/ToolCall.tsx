import { useMemo } from 'react';
import { actionDelimiter, actionDomainSeparator, Constants } from 'librechat-data-provider';
import * as Popover from '@radix-ui/react-popover';
import useLocalize from '~/hooks/useLocalize';
import ProgressCircle from './ProgressCircle';
import InProgressCall from './InProgressCall';
import CancelledIcon from './CancelledIcon';
import ProgressText from './ProgressText';
import FinishedIcon from './FinishedIcon';
import ToolPopover from './ToolPopover';
import WrenchIcon from './WrenchIcon';
import { useProgress } from '~/hooks';
import { logger } from '~/utils';

export default function ToolCall({
  initialProgress = 0.1,
  isSubmitting,
  name,
  args: _args = '',
  output,
}: {
  initialProgress: number;
  isSubmitting: boolean;
  name: string;
  args: string | Record<string, unknown>;
  output?: string | null;
}) {
  const localize = useLocalize();
  const progress = useProgress(initialProgress);
  const radius = 56.08695652173913;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  const [function_name, _domain] = name.split(actionDelimiter) as [string, string | undefined];
  const domain = _domain?.replaceAll(actionDomainSeparator, '.') ?? null;
  const error = output?.toLowerCase()?.includes('error processing tool');

  const args = useMemo(() => {
    if (typeof _args === 'string') {
      return _args;
    }

    try {
      return JSON.stringify(_args, null, 2);
    } catch (e) {
      logger.error(
        'client/src/components/Chat/Messages/Content/ToolCall.tsx - Failed to stringify args',
        e,
      );
      return '';
    }
  }, [_args]) as string | undefined;

  const hasInfo = useMemo(
    () => (args?.length ?? 0) > 0 || (output?.length ?? 0) > 0,
    [args, output],
  );

  const renderIcon = () => {
    if (progress < 1) {
      return (
        <InProgressCall progress={progress} isSubmitting={isSubmitting} error={error}>
          <div
            className="absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-full bg-transparent text-white"
            style={{ opacity: 1, transform: 'none' }}
            data-projection-id="849"
          >
            <div>
              <WrenchIcon />
            </div>
            <ProgressCircle radius={radius} circumference={circumference} offset={offset} />
          </div>
        </InProgressCall>
      );
    }

    return error === true ? <CancelledIcon /> : <FinishedIcon />;
  };

  const getFinishedText = () => {
    if (domain != null && domain && domain.length !== Constants.ENCODED_DOMAIN_LENGTH) {
      return localize('com_assistants_completed_action', domain);
    }
    return localize('com_assistants_completed_function', function_name);
  };

  return (
    <Popover.Root>
      <div className="my-2.5 flex items-center gap-2.5">
        <div className="relative h-5 w-5 shrink-0">{renderIcon()}</div>
        <ProgressText
          progress={progress}
          onClick={() => ({})}
          inProgressText={localize('com_assistants_running_action')}
          finishedText={getFinishedText()}
          hasInput={hasInfo}
          popover={true}
        />
        {hasInfo && (
          <ToolPopover
            input={args ?? ''}
            output={output}
            domain={domain ?? ''}
            function_name={function_name}
          />
        )}
      </div>
    </Popover.Root>
  );
}
