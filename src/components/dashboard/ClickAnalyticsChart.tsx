import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart as BaseLineChart,
  Line,
  BarChart as BaseBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// Recharts component typings for React 19
const LineChart = BaseLineChart as React.ComponentType<any>;
const BarChart = BaseBarChart as React.ComponentType<any>;
import { motion, AnimatePresence } from 'motion/react';
import { Profile, LinkItem, LinkClickEvent } from '../../types';
import { exportClickAnalyticsToCSV } from '../../lib/csvExport';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  MousePointerClick,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  Download,
  CheckCircle2,
} from 'lucide-react';

interface ClickAnalyticsChartProps {
  profile: Profile;
  links: LinkItem[];
  clickEvents: LinkClickEvent[];
  loading?: boolean;
}

interface DayDataPoint {
  date: string;
  label: string;
  weekday: string;
  fullDate: string;
  clicks: number;
  [linkKey: string]: any;
}

const LINE_COLORS = [
  '#818cf8', // Indigo
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f43f5e', // Rose
  '#38bdf8', // Sky
];

export const ClickAnalyticsChart: React.FC<ClickAnalyticsChartProps> = ({
  profile,
  links,
  clickEvents,
  loading = false,
}) => {
  const [viewMode, setViewMode] = useState<'total' | 'breakdown'>('total');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');
  const [animTrigger, setAnimTrigger] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Trigger animation refresh on filter or view mode shift
  useEffect(() => {
    setAnimTrigger((prev) => prev + 1);
  }, [viewMode, chartType, selectedLinkId, loading]);

  // Identify top links by overall click count
  const topLinks = useMemo(() => {
    return [...links]
      .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
      .slice(0, 4);
  }, [links]);

  // Aggregate click counts per day for the last 7 days
  const { chartData, total7DayClicks, dailyAverage, peakDay, peakClicks, trendPercentage } = useMemo(() => {
    const days: DayDataPoint[] = [];
    const today = new Date();

    // Prepare date buckets for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = i === 0;

      const label = isToday ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      // Filter click events belonging to this calendar day
      const dayClicks = clickEvents.filter((ev) => {
        if (!ev.clicked_at) return false;
        const evDate = new Date(ev.clicked_at);
        return evDate.toDateString() === d.toDateString();
      });

      let count = 0;
      const linkCounts: Record<string, number> = {};

      // Initialize top links counts
      topLinks.forEach((tl) => {
        linkCounts[`link_${tl.id}`] = 0;
      });

      if (selectedLinkId === 'all') {
        count = dayClicks.length;
      } else {
        count = dayClicks.filter((e) => e.link_id === selectedLinkId).length;
      }

      // Populate breakdown counts for top links
      topLinks.forEach((tl) => {
        linkCounts[`link_${tl.id}`] = dayClicks.filter((e) => e.link_id === tl.id).length;
      });

      days.push({
        date: dateStr,
        label,
        weekday,
        fullDate,
        clicks: count,
        ...linkCounts,
      });
    }

    // 7-day stats
    const total = days.reduce((sum, d) => sum + d.clicks, 0);
    const avg = Math.round((total / 7) * 10) / 10;

    let peak = { label: 'None', clicks: 0 };
    days.forEach((d) => {
      if (d.clicks >= peak.clicks) {
        peak = { label: d.label, clicks: d.clicks };
      }
    });

    // Trend: first 3 days vs last 3 days
    const firstHalf = days.slice(0, 3).reduce((acc, cur) => acc + cur.clicks, 0);
    const secondHalf = days.slice(4, 7).reduce((acc, cur) => acc + cur.clicks, 0);
    let trend = 0;
    if (firstHalf > 0) {
      trend = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    } else if (secondHalf > 0) {
      trend = 100;
    }

    return {
      chartData: days,
      total7DayClicks: total,
      dailyAverage: avg,
      peakDay: peak.label,
      peakClicks: peak.clicks,
      trendPercentage: trend,
    };
  }, [clickEvents, selectedLinkId, topLinks]);

  const handleExportCsv = () => {
    setIsExporting(true);
    setTimeout(() => {
      const ok = exportClickAnalyticsToCSV({
        profile,
        links,
        chartData,
        clickEvents,
      });
      setIsExporting(false);
      if (ok) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2500);
      }
    }, 150);
  };

  // Custom Dark Theme Tooltip matching LinkNest aesthetic
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DayDataPoint;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-2 min-w-[140px] max-w-[240px]">
          <div className="flex items-center gap-1.5 text-slate-400 border-b border-slate-800 pb-1.5 text-[11px] font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{data.fullDate}</span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 truncate">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color || '#818cf8' }}
                  />
                  <span className="text-slate-300 font-medium truncate max-w-[120px]">
                    {entry.name}
                  </span>
                </div>
                <span className="font-bold font-mono text-white shrink-0">
                  {entry.value} {entry.value === 1 ? 'click' : 'clicks'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden min-w-0">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Link Click Analytics Over Time
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Last 7 Days
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualized with Recharts to monitor daily visitor engagement and click velocity.
          </p>
        </div>

        {/* View mode toggle, Filter & Export CSV (Tablet/Desktop) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start lg:self-auto w-full sm:w-auto">
          {/* Download Analytics Button (Desktop & Tablet view) */}
          <button
            type="button"
            id="download-analytics-btn"
            data-testid="download-analytics-btn"
            onClick={handleExportCsv}
            disabled={isExporting}
            title="Download Analytics (client-side CSV export of last 7 days)"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 min-h-[36px]"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Analytics Downloaded</span>
              </>
            ) : isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download Analytics</span>
              </>
            )}
          </button>

          {/* Chart Type Toggle (Bar vs Line) */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="chart-type-bar-btn"
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Daily Bar Chart View"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bars</span>
            </button>
            <button
              id="chart-type-line-btn"
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'line'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Daily Line Trend View"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trend</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'total'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aggregate
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'breakdown'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Links
            </button>
          </div>

          {/* Filter by Link (only in 'total' mode) */}
          {viewMode === 'total' && links.length > 0 && (
            <div className="relative">
              <select
                value={selectedLinkId}
                onChange={(e) => setSelectedLinkId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors pr-7 appearance-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="all">All Managed Links</option>
                {links.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.title}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Quick 7-Day Performance Stats - Stack vertically on small screens */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 w-full"
      >
        <div className="p-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            7-Day Volume
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono">{total7DayClicks}</span>
            <span className="text-[10px] text-slate-400">clicks</span>
          </div>
        </div>

        <div className="p-1 border-t sm:border-t-0 border-slate-850 pt-2 sm:pt-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Daily Average
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-200 font-mono">{dailyAverage}</span>
            <span className="text-[10px] text-slate-400">/ day</span>
          </div>
        </div>

        <div className="p-1 border-t sm:border-t-0 border-slate-850 pt-2 sm:pt-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            Peak Day
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-bold text-indigo-400 font-mono">{peakClicks}</span>
            <span className="text-[10px] text-slate-400 truncate">({peakDay})</span>
          </div>
        </div>

        <div className="p-1 border-t sm:border-t-0 border-slate-850 pt-2 sm:pt-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
            7-Day Velocity
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                trendPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trendPercentage >= 0 ? `+${trendPercentage}%` : `${trendPercentage}%`}
            </span>
            <ArrowUpRight
              className={`w-3.5 h-3.5 ${
                trendPercentage >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400 rotate-90'
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* Recharts Line Chart Container */}
      <div className="w-full min-w-0 overflow-hidden pt-1">
        {loading ? (
          <div className="h-64 flex items-center justify-center bg-slate-950/40 rounded-xl">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            key={`chart-stage-${chartType}-${viewMode}-${selectedLinkId}-${animTrigger}`}
            initial={{ opacity: 0, y: 12, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-64 sm:h-72 w-full min-w-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 12, left: -22, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    opacity={0.35}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    dy={6}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    dx={-4}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {viewMode === 'total' ? (
                    <Bar
                      key={`bar-total-${selectedLinkId}-${animTrigger}`}
                      dataKey="clicks"
                      name={
                        selectedLinkId === 'all'
                          ? 'Total Clicks'
                          : links.find((l) => l.id === selectedLinkId)?.title || 'Link Clicks'
                      }
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={900}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 6 ? '#6366f1' : '#818cf8'}
                          fillOpacity={entry.clicks > 0 ? 0.95 : 0.35}
                        />
                      ))}
                    </Bar>
                  ) : (
                    topLinks.map((tl, index) => (
                      <Bar
                        key={`bar-breakdown-${tl.id}-${animTrigger}`}
                        dataKey={`link_${tl.id}`}
                        name={tl.title}
                        fill={LINE_COLORS[index % LINE_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={800 + index * 120}
                      />
                    ))
                  )}
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 15, right: 12, left: -22, bottom: 5 }}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    opacity={0.35}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    dy={6}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    dx={-4}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {viewMode === 'total' ? (
                    <Line
                      key={`line-total-${selectedLinkId}-${animTrigger}`}
                      type="monotone"
                      dataKey="clicks"
                      name={
                        selectedLinkId === 'all'
                          ? 'Total Clicks'
                          : links.find((l) => l.id === selectedLinkId)?.title || 'Link Clicks'
                      }
                      stroke="#818cf8"
                      strokeWidth={2.5}
                      isAnimationActive={true}
                      animationDuration={1100}
                      animationEasing="ease-out"
                      animationBegin={60}
                      dot={{
                        r: 4,
                        fill: '#818cf8',
                        stroke: '#0f172a',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#c7d2fe',
                        stroke: '#4f46e5',
                        strokeWidth: 2,
                      }}
                    />
                  ) : (
                    topLinks.map((tl, index) => (
                      <Line
                        key={`line-breakdown-${tl.id}-${animTrigger}`}
                        type="monotone"
                        dataKey={`link_${tl.id}`}
                        name={tl.title}
                        stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        strokeWidth={2.2}
                        isAnimationActive={true}
                        animationDuration={1000 + index * 180}
                        animationEasing="ease-out"
                        animationBegin={60 + index * 80}
                        dot={{
                          r: 3.5,
                          fill: LINE_COLORS[index % LINE_COLORS.length],
                          stroke: '#0f172a',
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 5.5,
                          stroke: '#ffffff',
                          strokeWidth: 2,
                        }}
                      />
                    ))
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Mobile-only Stacked Download Analytics Button: Chart on top, export button below, full width, no clipping */}
      <div className="block sm:hidden w-full pt-1">
        <button
          type="button"
          id="download-analytics-mobile-btn"
          data-testid="download-analytics-mobile-btn"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          {exportSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">Analytics Downloaded</span>
            </>
          ) : isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              <span>Downloading Analytics...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download Analytics</span>
            </>
          )}
        </button>
      </div>

      {/* Legend / Footer Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
        {viewMode === 'breakdown' ? (
          <div className="flex flex-wrap items-center gap-3">
            {topLinks.map((tl, index) => (
              <div key={tl.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: LINE_COLORS[index % LINE_COLORS.length] }}
                />
                <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-[180px]">
                  {tl.title}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span>
              Showing daily clicks for{' '}
              <strong className="text-slate-200">
                {selectedLinkId === 'all'
                  ? 'All Links'
                  : links.find((l) => l.id === selectedLinkId)?.title}
              </strong>
            </span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <MousePointerClick className="w-3 h-3 text-emerald-400" />
          <span>Real-time link click events</span>
        </div>
      </div>
    </div>
  );
};
