const os = require("os");

let timer = null;
let previousCpu = null;
let restarting = false;

// Reads cumulative CPU time counters from every logical processor.
function getCpuSnapshot() {
  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    const times = cpu.times;

    idle += times.idle;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
  }

  return { idle, total };
}

// Converts two cumulative CPU snapshots into percentage utilization.
function getCpuUsage(previous, current) {
  const idleDelta = current.idle - previous.idle;
  const totalDelta = current.total - previous.total;

  if (totalDelta <= 0) return 0;

  return ((totalDelta - idleDelta) / totalDelta) * 100;
}

// Periodically checks CPU usage and asks the process supervisor to restart the app.
function startCpuMonitor(server) {
  const threshold = Number(process.env.CPU_THRESHOLD || 70);
  const interval = Number(process.env.CPU_CHECK_INTERVAL_MS || 5000);
  const runningWithNodemon = process.env.npm_lifecycle_event === "dev";

  previousCpu = getCpuSnapshot();

  timer = setInterval(() => {
    const currentCpu = getCpuSnapshot();
    const usage = getCpuUsage(previousCpu, currentCpu);

    previousCpu = currentCpu;

    console.log(`CPU utilization: ${usage.toFixed(2)}%`);

    if (usage >= threshold && !restarting) {
      restarting = true;

      console.warn(
        `CPU utilization reached ${usage.toFixed(2)}%, threshold is ${threshold}%.`
      );

      server.close(() => {
        if (runningWithNodemon) {
          // Ask Nodemon to restart the child instead of treating it as a crash.
          process.kill(process.ppid, "SIGUSR2");
          return process.exit(0);
        }

        // PM2, Docker, or Kubernetes restarts the process after this exit.
        process.exit(1);
      });
    }
  }, interval);

  console.log(
    `CPU monitor started. Threshold: ${threshold}%, interval: ${interval}ms`
  );
}

// Cancels CPU sampling during graceful application shutdown.
function stopCpuMonitor() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = {
  startCpuMonitor,
  stopCpuMonitor,
  getCpuUsage
};
