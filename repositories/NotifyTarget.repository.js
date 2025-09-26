const { NotifyTarget } = require("../models");

class NotifyTargetRepository {
    // async createStudentNotification({notification_id, student_ids, transaction}) {
    //   await NotifyTarget.bulkCreate(
    //     student_ids.map((student) => ({
    //       notify_id: notification_id,
    //       grade_id: null,
    //       student_id: student,
    //       is_to_all_parents: 0,
    //       is_active: 1,
    //     })),
    //     { transaction }
    //   );
    // }

    async createParentNotification({notification_id, parent_ids, transaction}) {
      await NotifyTarget.bulkCreate(
        parent_ids.map((parent) => ({
          notify_id: notification_id,
          parent_id: parent,
          grade_id: null,
          student_id: null,
          is_to_all_parents: 0,
          is_active: 1,
        })),
        { transaction }
      );
    }
}

module.exports = new NotifyTargetRepository();