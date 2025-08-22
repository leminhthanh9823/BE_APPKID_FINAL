const { NotifyTarget } = require("../models");

class NotifyTargetRepository {

  async createGradeNotification({notification_id, grade_ids, transaction}) {
    await NotifyTarget.bulkCreate(
      grade_ids.map((grade) => ({
        notify_id: notification_id,
        grade_id: grade,
        student_id: null,
        is_to_all_parents: 0,
      })),
      { transaction }
    );
  }

    async createStudentNotification({notification_id, student_ids, transaction}) {
      await NotifyTarget.bulkCreate(
        student_ids.map((student) => ({
          notify_id: notification_id,
          grade_id: null,
          student_id: student,
          is_to_all_parents: 0,
          is_active: 1,
        })),
        { transaction }
      );
    }
}

module.exports = new NotifyTargetRepository();