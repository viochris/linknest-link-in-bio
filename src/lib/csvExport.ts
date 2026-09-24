import { Profile, LinkItem, LinkClickEvent } from '../types';

export interface DayDataSummary {
  date: string;
  label: string;
  weekday: string;
  fullDate: string;
  clicks: number;
  [key: string]: any;
}

/**
 * Generates an RFC-4180 compliant CSV document with UTF-8 BOM encoding
 * for seamless compatibility with Microsoft Excel, Google Sheets, Numbers,
 * and external business intelligence reporting tools.
 */
export function exportClickAnalyticsToCSV({
  profile,
  links,
  chartData,
  clickEvents,
}: {
  profile: Profile;
  links: LinkItem[];
  chartData: DayDataSummary[];
  clickEvents: LinkClickEvent[];
}): boolean {
  try {
    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const text = String(val).replace(/"/g, '""');
      return `"${text}"`;
    };

    const rows: string[] = [];

    let total7DayClicks = 0;
    for (const day of chartData) {
      total7DayClicks += day.clicks;
    }

    // Section 1: Standard Tabular Daily Link Click Data (Row 1 headers for direct Excel/Google Sheets compatibility)
    rows.push([
      'Date',
      'Day of Week',
      'Link Title',
      'Destination URL',
      'Daily Clicks',
      '7-Day Total Clicks',
      'All-Time Total Clicks',
      'Status',
    ].map(escapeCsv).join(','));

    // Populate daily records for each link across the 7-day window
    for (const day of chartData) {
      let dayTotalClicks = 0;
      for (const link of links) {
        const linkDayClicks = clickEvents.filter((e) => {
          if (!e.clicked_at || e.link_id !== link.id) return false;
          return new Date(e.clicked_at).toISOString().slice(0, 10) === day.date;
        }).length;

        const link7DayCount = clickEvents.filter((e) => e.link_id === link.id).length;
        dayTotalClicks += linkDayClicks;

        rows.push([
          escapeCsv(day.date),
          escapeCsv(day.weekday),
          escapeCsv(link.title),
          escapeCsv(link.url),
          escapeCsv(linkDayClicks),
          escapeCsv(link7DayCount),
          escapeCsv(link.click_count || 0),
          escapeCsv(link.is_active ? 'Active' : 'Archived'),
        ].join(','));
      }

      // Daily Total rollup row for spreadsheet summation
      rows.push([
        escapeCsv(day.date),
        escapeCsv(day.weekday),
        escapeCsv('[Daily Total - All Links]'),
        escapeCsv('All Managed Links'),
        escapeCsv(dayTotalClicks),
        escapeCsv(total7DayClicks),
        escapeCsv(links.reduce((sum, l) => sum + (l.click_count || 0), 0)),
        escapeCsv('Active'),
      ].join(','));
    }

    // Cumulative 7-day total row
    rows.push([
      escapeCsv('Last 7 Days (Total)'),
      escapeCsv('Cumulative 7-Day Window'),
      escapeCsv('[Cumulative Total - All Links]'),
      escapeCsv('All Managed Links'),
      escapeCsv(total7DayClicks),
      escapeCsv(total7DayClicks),
      escapeCsv(links.reduce((sum, l) => sum + (l.click_count || 0), 0)),
      escapeCsv('Active'),
    ].join(','));

    rows.push(''); // Blank divider row

    // Section 2: Link Performance Breakdown (Aggregated 7-Day & Lifetime Stats)
    rows.push(escapeCsv('--- LINK PERFORMANCE SUMMARY (LAST 7 DAYS) ---'));
    rows.push([
      'Link ID',
      'Link Title',
      'Destination URL',
      'Featured',
      '7-Day Clicks',
      'All-Time Total Clicks',
      '7-Day Share (%)',
      'Status',
    ].map(escapeCsv).join(','));

    for (const link of links) {
      const link7DayCount = clickEvents.filter((e) => e.link_id === link.id).length;
      const sharePct =
        total7DayClicks > 0
          ? ((link7DayCount / total7DayClicks) * 100).toFixed(1)
          : '0.0';

      rows.push([
        escapeCsv(link.id),
        escapeCsv(link.title),
        escapeCsv(link.url),
        escapeCsv(link.is_featured ? 'Yes' : 'No'),
        escapeCsv(link7DayCount),
        escapeCsv(link.click_count || 0),
        escapeCsv(`${sharePct}%`),
        escapeCsv(link.is_active ? 'Active' : 'Archived'),
      ].join(','));
    }

    rows.push(''); // Blank divider row

    // Section 3: Daily Click Matrix per Link (Cross-Tabulation)
    rows.push(escapeCsv('--- DAILY CLICKS BY LINK MATRIX ---'));
    const matrixHeaders = [
      'Date',
      'Day of Week',
      ...links.map((l) => l.title),
      'Daily Aggregate',
    ];
    rows.push(matrixHeaders.map(escapeCsv).join(','));

    for (const day of chartData) {
      const rowCols: string[] = [escapeCsv(day.date), escapeCsv(day.weekday)];
      let rowSum = 0;

      for (const link of links) {
        const linkDayClicks = clickEvents.filter((e) => {
          if (!e.clicked_at || e.link_id !== link.id) return false;
          return new Date(e.clicked_at).toISOString().slice(0, 10) === day.date;
        }).length;

        rowSum += linkDayClicks;
        rowCols.push(escapeCsv(linkDayClicks));
      }

      rowCols.push(escapeCsv(rowSum));
      rows.push(rowCols.join(','));
    }

    // Section 4: Export Metadata Header & Summary
    rows.push('');
    rows.push(escapeCsv('--- EXPORT METADATA & PROFILE SUMMARY ---'));
    rows.push([escapeCsv('Profile Handle'), escapeCsv('@' + (profile.username || ''))].join(','));
    rows.push([escapeCsv('Profile Display Name'), escapeCsv(profile.display_name || profile.username || 'User Profile')].join(','));
    rows.push([escapeCsv('Reporting Window'), escapeCsv('Last 7 Days')].join(','));
    rows.push([escapeCsv('Total Managed Links'), escapeCsv(links.length)].join(','));
    rows.push([escapeCsv('Total Lifetime Profile Views'), escapeCsv(profile.view_count || 0)].join(','));
    rows.push([escapeCsv('Total Lifetime Link Clicks'), escapeCsv(links.reduce((sum, l) => sum + (l.click_count || 0), 0))].join(','));
    rows.push([escapeCsv('Generated Timestamp (UTC)'), escapeCsv(new Date().toISOString())].join(','));

    // Section 4: Granular Click Event Log (if records exist)
    if (clickEvents.length > 0) {
      rows.push('');
      rows.push(escapeCsv('--- SECTION 4: GRANULAR CLICK EVENT LOGS (LAST 7 DAYS) ---'));
      rows.push([
        'Event ID',
        'Timestamp (UTC)',
        'Link Title',
        'Destination URL',
      ].map(escapeCsv).join(','));

      const sortedEvents = [...clickEvents].sort(
        (a, b) => new Date(b.clicked_at).getTime() - new Date(a.clicked_at).getTime()
      );

      for (const ev of sortedEvents) {
        const matched = links.find((l) => l.id === ev.link_id);
        rows.push([
          escapeCsv(ev.id),
          escapeCsv(ev.clicked_at),
          escapeCsv(matched ? matched.title : 'Unlinked or Deleted Item'),
          escapeCsv(matched ? matched.url : ''),
        ].join(','));
      }
    }

    const csvBody = rows.join('\r\n');
    // UTF-8 BOM (\uFEFF) ensures Excel properly decodes Unicode characters and line breaks
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvBody], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;

    const safeUsername = (profile.username || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    const dateStamp = new Date().toISOString().slice(0, 10);
    anchor.setAttribute('download', `linknest_analytics_${safeUsername}_${dateStamp}.csv`);

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('Error generating analytics CSV export:', err);
    return false;
  }
}
