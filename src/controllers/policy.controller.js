const User = require("../models/user.model");
const Policy = require("../models/policy.model");
// Register the referenced models before Mongoose executes populate().
require("../models/agent.model");
require("../models/userAccount.model");
require("../models/lob.model");
require("../models/carrier.model");

// Finds users by first name and returns their policies with related data populated.
async function getPoliciesByUsername(req, res, next) {
  try {
    const username = decodeURIComponent(req.params.username).trim();

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    const users = await User.find({
      firstName: { $regex: `^${escapeRegex(username)}$`, $options: "i" }
    }).lean();

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userIds = users.map((user) => user._id);

    const policies = await Policy.find({ userId: { $in: userIds } })
      .populate("agentId", "name")
      .populate("accountId", "accountName")
      .populate("lobId", "categoryName")
      .populate("carrierId", "companyName")
      .populate("userId", "firstName email phone state zipCode")
      .lean();

    return res.json({
      success: true,
      count: policies.length,
      data: policies
    });
  } catch (error) {
    next(error);
  }
}

// Groups policies by user and joins category/carrier details in MongoDB.
async function aggregatePoliciesByUser(req, res, next) {
  try {
    const result = await Policy.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      {
        $lookup: {
          from: "lobs",
          localField: "lobId",
          foreignField: "_id",
          as: "lob"
        }
      },
      {
        $unwind: {
          path: "$lob",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: "carriers",
          localField: "carrierId",
          foreignField: "_id",
          as: "carrier"
        }
      },
      {
        $unwind: {
          path: "$carrier",
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $group: {
          _id: "$user._id",
          userName: { $first: "$user.firstName" },
          email: { $first: "$user.email" },
          totalPolicies: { $sum: 1 },
          totalPremium: { $sum: { $ifNull: ["$premiumAmount", 0] } },
          policies: {
            $push: {
              policyNumber: "$policyNumber",
              policyStartDate: "$policyStartDate",
              policyEndDate: "$policyEndDate",
              category: "$lob.categoryName",
              carrier: "$carrier.companyName"
            }
          }
        }
      },

      {
        $project: {
          _id: 0,
          userId: "$_id",
          userName: 1,
          email: 1,
          totalPolicies: 1,
          totalPremium: 1,
          policies: 1
        }
      },

      { $sort: { userName: 1 } }
    ]);

    return res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

// Escapes user input before it is inserted into a regular expression.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  getPoliciesByUsername,
  aggregatePoliciesByUser
};
