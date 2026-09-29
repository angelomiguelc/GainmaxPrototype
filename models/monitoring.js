const defaultSnapshot = {
  performanceRatio: 82.5,
  targetPerformanceRatio: 80,
  expectedYieldKwh: 2150,
  actualYieldKwh: 2210,
  gridOffsetKwh: 1840,
  systemStatus: 'All Inverters Online',
  inverters: [
    { id: 'INV-01', model: 'Solis S5-GR3P', powerKw: 8.1, dailyYieldKwh: 742, status: 'Online', lastUpdated: '2 min ago' },
    { id: 'INV-02', model: 'Solis S5-GR3P', powerKw: 6.4, dailyYieldKwh: 603, status: 'Online', lastUpdated: '2 min ago' },
    { id: 'INV-03', model: 'Solis S5-GR3P', powerKw: 4.7, dailyYieldKwh: 451, status: 'Online', lastUpdated: '3 min ago' },
  ],
  activeAlarms: [
    { id: 'cleaning-reminder', severity: 'Warning', title: 'Scheduled panel cleaning', detail: 'Recommended cleaning due in 12 days.', since: 'Today, 09:00' },
  ],
  resolvedAlarms: [
    { id: 'grid-voltage-check', severity: 'Normal', title: 'Grid voltage fluctuation', detail: 'Grid voltage returned to normal operating range.', since: 'Resolved Sep 21, 2026' },
  ],
  history: [
    { month: 'Apr', generationKwh: 1870, gridOffsetKwh: 1540 },
    { month: 'May', generationKwh: 2015, gridOffsetKwh: 1660 },
    { month: 'Jun', generationKwh: 1940, gridOffsetKwh: 1585 },
    { month: 'Jul', generationKwh: 2080, gridOffsetKwh: 1725 },
    { month: 'Aug', generationKwh: 2155, gridOffsetKwh: 1790 },
    { month: 'Sep', generationKwh: 2210, gridOffsetKwh: 1840 },
  ],
  demo: true,
};

function getMonitoringSnapshot(project) {
  const monitoring = project.monitoring || defaultSnapshot;
  return {
    ...monitoring,
    inverters: monitoring.inverters.map((inverter) => ({ ...inverter })),
    activeAlarms: monitoring.activeAlarms.map((alarm) => ({ ...alarm })),
    resolvedAlarms: monitoring.resolvedAlarms.map((alarm) => ({ ...alarm })),
    history: monitoring.history.map((month) => ({ ...month })),
  };
}

module.exports = { getMonitoringSnapshot };
