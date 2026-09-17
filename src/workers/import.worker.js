const fs = require("fs");
const path = require("path");
const { parentPort, workerData } = require("worker_threads");
const mongoose = require("mongoose");
const csv = require("csv-parser");
const XLSX = require("xlsx");

const Agent = require("../models/Agent");
const User = require("../models/User");
const UserAccount = require("../models/UserAccount");
const LOB = require("../models/LOB");
const Carrier = require("../models/Carrier");
const Policy = require("../models/Policy");

// Converts spreadsheet values to trimmed nullable values for database writes.
function clean(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

// Makes CSV/XLSX headers case-insensitive and removes a possible UTF-8 BOM.
function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/^\uFEFF/, "").trim().toLowerCase(),
      value
    ])
  );
}

// Converts a spreadsheet value to a number, returning null for invalid values.
function parseNumber(value) {
  const cleaned = clean(value);
  if (cleaned === null) return null;

  const number = Number(cleaned);
  return Number.isNaN(number) ? null : number;
}

// Converts a spreadsheet value to a JavaScript Date, returning null when invalid.
function parseDate(value) {
  const cleaned = clean(value);
  if (!cleaned) return null;

  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Reads CSV rows asynchronously so the worker can process the complete file.
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// Reads the first worksheet from an XLSX/XLS file as plain row objects.
function parseSpreadsheet(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(firstSheet, {
    defval: null
  });
}

// Selects the correct parser using the original upload filename because Multer
// stores the temporary file with a generated name that has no extension.
function parseFile(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext === ".csv") {
    return parseCSV(filePath);
  }

  if (ext === ".xlsx" || ext === ".xls") {
    return Promise.resolve(parseSpreadsheet(filePath));
  }

  throw new Error("Unsupported file type");
}

// Finds a related document or creates it atomically when it does not exist.
async function getOrCreate(model, filter, document) {
  return model.findOneAndUpdate(
    filter,
    { $setOnInsert: document },
    { new: true, upsert: true }
  );
}

// Maps imported rows into the six requested collections in manageable batches.
async function importRows(rows) {
  const batchSize = Number(process.env.MAX_IMPORT_BATCH_SIZE || 500);

  const stats = {
    totalRows: rows.length,
    users: 0,
    agents: 0,
    accounts: 0,
    lobs: 0,
    carriers: 0,
    policiesInserted: 0,
    policiesSkipped: 0
  };

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);

    for (const row of batch) {
      const normalizedRow = normalizeRow(row);
      const firstName = clean(normalizedRow.firstname);
      const agentName = clean(normalizedRow.agent);
      const accountName = clean(normalizedRow.account_name);
      const categoryName = clean(normalizedRow.category_name);
      const companyName = clean(normalizedRow.company_name);
      const policyNumber = clean(normalizedRow.policy_number);

      if (!firstName || !policyNumber) {
        stats.policiesSkipped++;
        continue;
      }

      const agent = agentName
        ? await getOrCreate(Agent, { name: agentName }, { name: agentName })
        : null;

      const user = await User.findOneAndUpdate(
        {
          firstName: firstName,
          email: clean(normalizedRow.email)
        },
        {
          $set: {
            firstName,
            dob: parseDate(normalizedRow.dob),
            address: clean(normalizedRow.address),
            phone: clean(normalizedRow.phone),
            state: clean(normalizedRow.state),
            zipCode: clean(normalizedRow.zip),
            email: clean(normalizedRow.email),
            gender: clean(normalizedRow.gender),
            userType: clean(normalizedRow.usertype)
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      stats.users++;

      const account = accountName
        ? await getOrCreate(
            UserAccount,
            { accountName, userId: user._id },
            { accountName, userId: user._id }
          )
        : null;

      if (account) stats.accounts++;

      const lob = categoryName
        ? await getOrCreate(
            LOB,
            { categoryName },
            { categoryName }
          )
        : null;

      if (lob) stats.lobs++;

      const carrier = companyName
        ? await getOrCreate(
            Carrier,
            { companyName },
            { companyName }
          )
        : null;

      if (carrier) stats.carriers++;

      try {
        await Policy.create({
          policyNumber,
          policyStartDate: parseDate(normalizedRow.policy_start_date),
          policyEndDate: parseDate(normalizedRow.policy_end_date),
          policyMode: parseNumber(normalizedRow.policy_mode),
          policyType: clean(normalizedRow.policy_type),
          premiumAmount: parseNumber(normalizedRow.premium_amount),
          premiumAmountWritten: parseNumber(normalizedRow.premium_amount_written),
          userId: user._id,
          agentId: agent?._id,
          accountId: account?._id,
          lobId: lob?._id,
          carrierId: carrier?._id
        });

        stats.policiesInserted++;
      } catch (error) {
        if (error.code === 11000) {
          stats.policiesSkipped++;
          continue;
        }

        throw error;
      }
    }
  }

  return stats;
}

// Connects the worker to MongoDB, imports the file, reports the result, and cleans up.
async function main() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(uri);

    const rows = await parseFile(workerData.filePath, workerData.originalName);
    const stats = await importRows(rows);

    await mongoose.connection.close();

    try {
      fs.unlinkSync(workerData.filePath);
    } catch (_) {}

    parentPort.postMessage({
      success: true,
      message: "File imported successfully",
      data: stats
    });
  } catch (error) {
    try {
      await mongoose.connection.close();
    } catch (_) {}

    try {
      fs.unlinkSync(workerData.filePath);
    } catch (_) {}

    parentPort.postMessage({
      success: false,
      message: error.message
    });
  }
}

main();
