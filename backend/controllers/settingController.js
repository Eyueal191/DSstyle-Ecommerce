import Setting from "../models/setting.js";

// GET /api/setting
export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne().lean();
    if (!setting) {
      setting = await Setting.create({});
    }
    return res.status(200).json({
      success: true,
      error: false,
      data: setting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to retrieve settings",
    });
  }
};

// PUT /api/setting
export const updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    // Don't allow overwrite of _id
    delete updateData._id;

    let setting = await Setting.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      error: false,
      message: "Settings updated successfully",
      data: setting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message || "Failed to update settings",
    });
  }
};

