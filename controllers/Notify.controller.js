
const db = require("../models/index.js");
const NotifyRepo = require("../repositories/Notify.repository.js");
const NotifyTargetRepository = require("../repositories/NotifyTarget.repository.js");
const messageManager = require("../helpers/MessageManager.helper.js");

// Validate notification data
function validateNotificationData(data) {
  if (!data.title || data.title.trim() === "") {
    return "Title is required";
  }
  if (data.title.length > 255) {
    return "Title must be less than 255 characters";
  }
  if (data.content && typeof data.content === "string" && data.content.length > 1000) {
    return "Content must be less than 1000 characters";
  }
  if (data.is_active === undefined || data.is_active === null) {
    return "Please select one status";
  }
  if (data.type_target === 1 && (!Array.isArray(data.parents) || data.parents.length === 0)) {
    return "Please select at least one parent";
  }
  if (data.type_target === 2 && (!Array.isArray(data.students) || data.students.length === 0)) {
    return "Please select at least one student";
  }
  return null;
}

exports.getAll = async (req, res) => {
  try {
    let { searchTerm = "", pageNumb = 1, pageSize = 10 } = req.body || {};
    let offset = (pageNumb - 1) * pageSize;

    let { rows, count } = await NotifyRepo.getAll({
      searchTerm,
      offset,
      pageSize,
    });
    // Xác định target_type cho từng notify
    rows.forEach((q) => {
      let target_type = null;
      if (Array.isArray(q.notify_target)) {
        if (
          q.notify_target.length === 1 &&
          q.notify_target[0].is_to_all_parents
        ) {
          target_type = "All Parents";
        } else if (
          q.notify_target.length > 0 &&
          q.notify_target.some((t) => t.parent_id)
        ) {
          target_type = "Specific Parents";
        } else if (
          q.notify_target.length > 0 &&
          q.notify_target.some((t) => t.student_id)
        ) {
          target_type = "Students";
        }
      }
      q.target_type = target_type;
    });
    return messageManager.fetchSuccess('notification',{
      records: rows.map((q) => ({
        id: q.id,
        title: q.title,
        content: q.content,
        target_type: q.target_type,
        send_date: q.send_date,
        is_active: q.is_active,
      })),
      total_record: count,
      total_page: Math.ceil(count / pageSize),
    }, res);
  } catch (error) {
    return messageManager.fetchFailed("notification", res, error);
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, type_target, is_active, parents, students } = req.body;
    const validationError = validateNotificationData(req.body);
    if (validationError) {
      return messageManager.validationFailed("notification", res, validationError);
    }

    const sequelize = db.sequelize;
    const transaction = await sequelize.transaction();
    try {
      let newNotification = await db.Notify.create(
        {
          title,
          content,
          is_active,
          send_date: new Date(Date.now() + 60 * 1000),
        },
        { transaction }
      );

      let result;
      if (type_target == 0) {
        result = await db.NotifyTarget.create(
          {
            notify_id: newNotification.id,
            parent_id: null,
            student_id: null,
            is_to_all_parents: 1,
          },
          { transaction }
        );
      }

      if (type_target === 1 && Array.isArray(parents)) {
        result = await NotifyTargetRepository.createParentNotification({
          notification_id: newNotification.id,
          parent_ids: parents,
          transaction: transaction,
        });
      }

      if (type_target === 2 && Array.isArray(students)) {
        result = await NotifyTargetRepository.createStudentNotification({
          notification_id: newNotification.id,
          student_ids: students,
          transaction: transaction,
        });
      }

      await transaction.commit();
  return messageManager.createSuccess("notification", null, res);
    } catch (error) {
      await transaction.rollback();
  return messageManager.createFailed("notification", res, error.message);
    }
  } catch (error) {
  return messageManager.createFailed("notification", res, error.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return messageManager.notFound("notification", res);
    }
    const records = await NotifyRepo.getNotificationById(id);
    if (!records) {
      return messageManager.notFound("notification", res);
    }
  return messageManager.fetchSuccess("notification",records, res);
  } catch (error) {
  return messageManager.fetchFailed("notification", res, error.message);
  }
};

exports.updateById = async (req, res) => {
  try {
  const { id, title, content, is_active, parents, students } = req.body;

    if (!id) {
      return messageManager.notFound("notification", res);
    }
    const records = await NotifyRepo.getNotificationById(id);
    if (!records) {
      return messageManager.notFound("notification", res);
    }

    let targetNotifications = await db.NotifyTarget.findAll({
        where: { notify_id: id },
      });

    let type_target = 0;
    if (targetNotifications[0] && targetNotifications[0].parent_id) {
      type_target = 1;
    } else if (targetNotifications[0] && targetNotifications[0].student_id) {
      type_target = 2;
    }
    const validationError = validateNotificationData({ title, content, is_active, type_target, parents, students });

    if (validationError) {
      return messageManager.validationFailed("notification", res, validationError);
    }

    const sequelize = db.sequelize;
    const transaction = await sequelize.transaction();
    try {
      await db.Notify.update(
        {
          title,
          content,
          is_active,
        },
        {
          where: { id },
          transaction,
        }
      );

      if (type_target === 1 && targetNotifications.length > 0) {
        const existingParentIds = targetNotifications
          .map((t) => t.parent_id)
          .filter((id) => id !== null);
        const newParentIds = parents.filter(
          (id) => !existingParentIds.includes(id)
        );
        const removedParentIds = existingParentIds.filter(
          (id) => !parents.includes(id)
        );

        // Remove parents that are not in the new list
        if (removedParentIds.length > 0) {
          await db.NotifyTarget.destroy({
            where: {
              notify_id: id,
              parent_id: removedParentIds,
            },
            transaction,
          });
        }

        // Add new parents that are not in the old list
        if (newParentIds.length > 0) {
          await db.NotifyTarget.bulkCreate(
            newParentIds.map((parentId) => ({
              notify_id: id,
              parent_id: parentId,
              student_id: null,
              is_to_all_parents: 0,
            })),
            { transaction }
          );
        }
      }

      if (type_target === 2 && targetNotifications.length > 0) {
        const existingStudentIds = targetNotifications
          .map((t) => t.student_id)
          .filter((id) => id !== null);
        const newStudentIds = students.filter(
          (id) => !existingStudentIds.includes(id)
        );
        const removedStudentIds = existingStudentIds.filter(
          (id) => !students.includes(id)
        );
        if (removedStudentIds.length > 0) {
          await db.NotifyTarget.destroy({
            where: {
              notify_id: id,
              student_id: removedStudentIds,
            },
            transaction,
          });
        }
        if (newStudentIds.length > 0) {
          await db.NotifyTarget.bulkCreate(
            newStudentIds.map((studentId) => ({
              notify_id: id,
              parent_id: null,
              student_id: studentId,
              is_to_all_parents: 0,
            })),
            { transaction }
          );
        }
      }

      await transaction.commit();
  return messageManager.updateSuccess("notification", null, res);
    } catch (error) {
      await transaction.rollback();
  return messageManager.updateFailed("notification", res, error.message);
    }
  } catch (error) {
  return messageManager.fetchFailed("notification", res, error.message);
  }
};

exports.getByParent = async (req, res) => {
  try {
    let {
      studentId,
      searchTerm = "",
      pageNumb = 1,
      pageSize = 10,
    } = req.body || {};
    let offset = (pageNumb - 1) * pageSize;
    let { rows, count } = await NotifyRepo.getNotificationsForParent({
      studentId,
      searchTerm,
      offset,
      pageSize,
    });
    return messageManager.fetchSuccess("notification", {
      notification_list: rows.map((q) => ({
        notify_id: q.id,
        title: q.title,
        content: q.content,
        send_date: q.send_date,
      })),
      total_record: count,
      total_page: Math.ceil(count / pageSize),
    }, res);
  } catch (error) {
  return messageManager.fetchFailed("notification", res, error.message);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (!id || isNaN(id)) {
      return messageManager.notFound("notification", res);
    }

    const notification = await db.Notify.findByPk(id);
    if (!notification) {
      return messageManager.notFound("notification", res);
    }
    const newStatus = notification.is_active === 1 ? 0 : 1;
    await notification.update({ is_active: newStatus });
  return messageManager.updateSuccess("notification", notification, res);
  } catch (error) {
  return messageManager.updateFailed("notification", res, error.message);
  }
};
