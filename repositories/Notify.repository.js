const { Notify, NotifyTarget, KidStudent, User } = require("../models");
const { fn, col, Op } = require("sequelize");

class NotifyRepository {
  async getAll({ searchTerm = "", offset = 0, pageSize = 10 }) {
    const whereCondition = {};
    if (searchTerm) {
      whereCondition.title = { [Op.like]: `%${searchTerm}%` };
    }

    const { rows, count } = await Notify.findAndCountAll({
      where: whereCondition,
      offset,
      limit: pageSize,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: NotifyTarget,
          as: "notify_target",
          attributes: [
            "id",
            "notify_id",
            // "grade_id",
            "student_id",
            "is_to_all_parents",
            "is_active",
          ],
        },
      ],
    });
    return { rows, count };
  }

  async getNotificationById(id) {
    return await Notify.findByPk(id, {
      include: [
        {
          model: NotifyTarget,
          as: "notify_target",
          attributes: [
            "id",
            "notify_id",
            // "grade_id",
            "student_id",
            "is_to_all_parents",
            "is_active",
          ],
        },
      ],
    });
  }

  async getNotificationsForParent({
    studentId,
    searchTerm = "",
    offset = 0,
    pageSize = 10,
  }) {
    if (!studentId) {
      // Nếu không tìm thấy student, chỉ trả về thông báo dành cho tất cả phụ huynh
      const whereNotify = { is_active: 1 };
      if (searchTerm) {
        whereNotify.title = { [Op.like]: `%${searchTerm}%` };
      }
      const { rows, count } = await Notify.findAndCountAll({
        where: whereNotify,
        include: [
          {
            model: NotifyTarget,
            as: "notify_target",
            where: {
              is_to_all_parents: 1,
            },
            required: true,
          },
        ],
        order: [["send_date", "DESC"]],
        offset,
        limit: pageSize,
      });
      return { rows, count };
    }

    const student = await KidStudent.findByPk(studentId, {
      attributes: ["id", "grade_id"],
    });

    let whereConditions = [];

    // Điều kiện 1: Thông báo gửi đến tất cả phụ huynh
    whereConditions.push({
      is_to_all_parents: 1,
    });

    // Điều kiện 2: Thông báo gửi đến grade của student
    // whereConditions.push({
    //   grade_id: student.grade_id,
    //   is_to_all_parents: 0,
    // });

    // Điều kiện 3: Thông báo gửi trực tiếp đến student
    whereConditions.push({
      student_id: studentId,
      is_to_all_parents: 0,
    });

    const whereNotify = { is_active: 1 };
    if (searchTerm) {
      whereNotify.title = { [Op.like]: `%${searchTerm}%` };
    }

    const { rows, count } = await Notify.findAndCountAll({
      where: whereNotify,
      include: [
        {
          model: NotifyTarget,
          as: "notify_target",
          where: {
            [Op.or]: whereConditions,
          },
          required: true,
        },
      ],
      order: [["send_date", "DESC"]],
      offset,
      limit: pageSize,
    });
    return { rows, count };
  }
}

module.exports = new NotifyRepository();
