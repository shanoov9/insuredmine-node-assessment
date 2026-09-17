const ScheduledMessage = require("../models/ScheduledMessage");

// Validates a requested date/time and stores a message for the background scheduler.
async function scheduleMessage(req, res, next) {
  try {
    const { message, day, time } = req.body;

    if (
      typeof message !== "string" || !message.trim() || typeof day !== "string" || typeof time !== "string" ||
      !day ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        message: "message, day and time are required"
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return res.status(400).json({
        success: false,
        message: "day must use YYYY-MM-DD format"
      });
    }

    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
      return res.status(400).json({
        success: false,
        message: "time must use HH:mm or HH:mm:ss format"
      });
    }

    const [year, month, date] = day.split("-").map(Number);
    const [hours, minutes, seconds = 0] = time.split(":").map(Number);
    const scheduledAt = new Date(year, month - 1, date, hours, minutes, seconds);

    if (
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getFullYear() !== year ||
      scheduledAt.getMonth() !== month - 1 ||
      scheduledAt.getDate() !== date ||
      scheduledAt.getHours() !== hours ||
      scheduledAt.getMinutes() !== minutes ||
      scheduledAt.getSeconds() !== seconds
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid day/time"
      });
    }

    if (scheduledAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date/time must be in the future"
      });
    }

    const scheduledMessage = await ScheduledMessage.create({
      message: message.trim(),
      scheduledAt
    });

    return res.status(201).json({
      success: true,
      message: "Message scheduled successfully",
      data: scheduledMessage
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { scheduleMessage };
