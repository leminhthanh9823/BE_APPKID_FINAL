exports.getAllRoles = async (req, res) => {
  try {
    const roles = [
      { role_id: 1, name: "admin" },
      { role_id: 2, name: "teacher" },
      { role_id: 3, name: "parent" },
    ];

    return res.json({
      success: true,
      status: 1,
      data: {
        records: roles,
        total_record: roles.length,
        total_page: 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Error getting role list",
      error: error.message,
    });
  }
};
