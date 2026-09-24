import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  Timer,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  toDateTimeLocalString,
  formatFriendlyDateTime,
  getRelativeTimeString,
} from '../../lib/dateUtils';

interface LinkScheduleDatePickerProps {
  startDate: string; // YYYY-MM-DDTHH:mm or empty
  endDate: string; // YYYY-MM-DDTHH:mm or empty
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClearSchedule: () => void;
}

export const LinkScheduleDatePicker: React.FC<LinkScheduleDatePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearSchedule,
}) => {
  // Current user local timezone info
  const localTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local Time';
    }
  }, []);

  // Quick preset helpers
  const handleSetStartNow = () => {
    const now = new Date();
    onStartDateChange(toDateTimeLocalString(now));
  };

  const handleAddStartHour = (hours: number = 1) => {
    const base = startDate ? new Date(startDate) : new Date();
    const target = new Date(base.getTime() + hours * 3600000);
    onStartDateChange(toDateTimeLocalString(target));
  };

  const handleSetEndInHours = (hours: number) => {
    const base = startDate ? new Date(startDate) : new Date();
    const target = new Date(base.getTime() + hours * 3600000);
    onEndDateChange(toDateTimeLocalString(target));
  };

  const handleSetEndInDays = (days: number) => {
    const base = startDate ? new Date(startDate) : new Date();
    const target = new Date(base.getTime() + days * 86400000);
    onEndDateChange(toDateTimeLocalString(target));
  };

  const handleSetEndOfMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Last day of current month at 23:59
    const lastDay = new Date(year, month + 1, 0, 23, 59, 0);
    onEndDateChange(toDateTimeLocalString(lastDay));
  };

  // Schedule status calculation
  const scheduleStatus = useMemo(() => {
    if (!startDate && !endDate) {
      return {
        type: 'permanent',
        title: 'Permanent Link',
        description: 'Link has no time limits and remains visible indefinitely while active.',
        badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
        icon: CheckCircle2,
      };
    }

    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Validation: End <= Start
    if (start && end && end.getTime() <= start.getTime()) {
      return {
        type: 'invalid',
        title: 'Invalid Date Range',
        description: 'Expiry time must be later than activation time.',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: AlertTriangle,
      };
    }

    // Has expired?
    if (end && end.getTime() < now.getTime()) {
      return {
        type: 'expired',
        title: 'Link Expired',
        description: `Expired ${getRelativeTimeString(end, now)} on ${formatFriendlyDateTime(end)}. This link will not appear on your public page.`,
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        icon: AlertTriangle,
      };
    }

    // Scheduled for future activation?
    if (start && start.getTime() > now.getTime()) {
      return {
        type: 'scheduled',
        title: 'Scheduled for Future',
        description: `Will go live ${getRelativeTimeString(start, now)} on ${formatFriendlyDateTime(start)}.`,
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        icon: Timer,
      };
    }

    // Currently Live with an expiry date
    if (end) {
      return {
        type: 'active_window',
        title: 'Active Now (Time-Limited)',
        description: `Live now and will automatically expire ${getRelativeTimeString(end, now)} on ${formatFriendlyDateTime(end)}.`,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: CheckCircle2,
      };
    }

    // Live from start date onward
    return {
      type: 'active_from_start',
      title: 'Active (Started)',
      description: `Activated ${getRelativeTimeString(start!, now)} on ${formatFriendlyDateTime(start)}. No expiration date set.`,
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: CheckCircle2,
    };
  }, [startDate, endDate]);

  const StatusIcon = scheduleStatus.icon;

  return (
    <div className="space-y-4 p-3.5 sm:p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
      {/* Header with Timezone hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-white tracking-wide">
            Link Activation & Expiry Schedule
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline" title="User device timezone">
            Timezone: {localTimezone}
          </span>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={onClearSchedule}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              title="Remove all scheduling dates"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Pickers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Activation (Start) Time */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Activation Time (Start)</span>
            </label>
            {startDate && (
              <button
                type="button"
                onClick={() => onStartDateChange('')}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
                title="Clear activation time (starts immediately)"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="link-schedule-start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Quick Presets for Start Time */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium">Quick:</span>
            <button
              type="button"
              onClick={handleSetStartNow}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-emerald-400 font-medium transition-colors cursor-pointer"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => handleAddStartHour(1)}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium transition-colors cursor-pointer"
            >
              +1 Hour
            </button>
            <button
              type="button"
              onClick={() => handleAddStartHour(24)}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Tomorrow
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            {startDate
              ? `Goes live: ${formatFriendlyDateTime(startDate)}`
              : 'Immediately live once saved and enabled'}
          </p>
        </div>

        {/* Expiry (End) Time */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-rose-400" />
              <span>Expiry Time (End)</span>
            </label>
            {endDate && (
              <button
                type="button"
                onClick={() => onEndDateChange('')}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
                title="Clear expiry time (link never expires)"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="relative">
            <input
              id="link-schedule-end-date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Quick Presets for End Time */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-medium">Quick:</span>
            <button
              type="button"
              onClick={() => handleSetEndInHours(24)}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium transition-colors cursor-pointer"
            >
              +24 Hours
            </button>
            <button
              type="button"
              onClick={() => handleSetEndInDays(3)}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium transition-colors cursor-pointer"
            >
              +3 Days
            </button>
            <button
              type="button"
              onClick={() => handleSetEndInDays(7)}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-indigo-300 font-medium transition-colors cursor-pointer"
            >
              +7 Days
            </button>
            <button
              type="button"
              onClick={handleSetEndOfMonth}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium transition-colors cursor-pointer"
            >
              End of Month
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            {endDate
              ? `Auto-expires: ${formatFriendlyDateTime(endDate)}`
              : 'Permanent: does not expire automatically'}
          </p>
        </div>
      </div>

      {/* Real-time Schedule Status Banner */}
      <div
        className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all ${scheduleStatus.badgeClass}`}
      >
        <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">{scheduleStatus.title}</span>
            {scheduleStatus.type === 'active_window' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <p className="text-[11px] leading-relaxed opacity-90 mt-0.5">
            {scheduleStatus.description}
          </p>
        </div>
      </div>
    </div>
  );
};
