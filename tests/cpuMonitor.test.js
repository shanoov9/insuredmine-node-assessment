const { getCpuUsage } = require("../src/utils/cpuMonitor");

describe("CPU monitor calculation", () => {
  // Verifies utilization is calculated from idle and total CPU deltas.
  test("calculates CPU utilization", () => {
    const previous = { idle: 100, total: 1000 };
    const current = { idle: 110, total: 1100 };

    const usage = getCpuUsage(previous, current);

    expect(usage).toBeCloseTo(90);
  });
});
