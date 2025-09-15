const sendEmail = require("../helpers/SendMail.helper.js");
const db = require("../models/index.js");
const FeedbackRepo = require("../repositories/Feedback.repository.js");
const {
  FeedbackSolveRepository: FeedbackSolveRepo,
} = require("../repositories/FeedbackSolve.repository.js");
const UserRepository = require("../repositories/User.repository.js");
const messageManager = require("../helpers/MessageManager.helper.js");

exports.sendFeedback = async (req, res) => {
  try {
    const { user_id, reading_id = null, rating = null, comment } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json(
          messageManager.validationFailed("feedback", res, "User is invalid")
        );
    }
    let feedback_category_id = 1;
    if (reading_id == undefined || reading_id == null) {
      feedback_category_id = 0;
    } 
    const sequelize = db.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const feedback = await FeedbackRepo.sendFeedback({
        user_id,
        reading_id,
        comment: comment,
        rating,
        feedback_category_id,
        is_important: 0,
        status: 0,
        transaction,
      });
      if (!feedback) {
        throw new Error("Error sending feedback.");
      }

      let feedbackSolve = await FeedbackSolveRepo.createFeedbackSolve({
        feedback_id: feedback.id,
        transaction,
      });

      if (!feedbackSolve) {
        throw new Error("Error sending feedback.");
      }
      await transaction.commit();
      return res.json(messageManager.createSuccess("feedback"));
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return res.json(messageManager.createFailed("feedback"));
  }
};

exports.getFeedBacks = async (req, res) => {
  try {
    const {
      teacher_id = null,
      feedback_category_id = null,
      searchTerm = "",
      pageNumb = 1,
      pageSize = 10,
    } = req.body || {};
    let { id: userId } = req.user || {};

    let user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(404).json(messageManager.notFound("user"));
    }
    let isAdmin = user.role_id === 1;
    const page = parseInt(pageNumb);
    const limit = parseInt(pageSize);

    let { rows, count } = await FeedbackRepo.getFeedbacks({
      teacher_id: isAdmin ? teacher_id : userId,
      feedback_category_id,
      searchTerm,
      page,
      limit,
    });
    const feedbacks = rows.map((fb) => {
      let feedbackSolve = fb.feedbackSolves?.[0] || {};
      return {
        id: fb.id,
        comment: fb.comment,
        rating: fb.rating,
        is_important: fb.is_important,
        status_feedback: fb.status,
        is_active: fb.is_active,
        parent: fb.user?.name || null,
        reading: fb.reading?.title || null,
        category: fb.feedbackCategory?.name || null,
        solver: feedbackSolve?.solver?.name || null,
        status_solve: feedbackSolve?.status_solve || 0,
        confirmer: feedbackSolve?.confirmer?.name || null,
        status_confirm: feedbackSolve?.status_confirm || 0,
        deadline: feedbackSolve?.deadline || null,
      };
    });

    return messageManager.fetchSuccess(
      "feedback",
      {
        records: feedbacks,
        total_record: count,
        total_page: Math.ceil(count / limit),
      },
      res
    );
  } catch (error) {
    return res.json(messageManager.fetchFailed("feedback"));
  }
};

exports.getFeedbackDetail = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return messageManager.notFound("feedback", res);
    }

    const feedback = await FeedbackRepo.getFeedbackDetail(id);

    if (!feedback) {
      return messageManager.notFound("feedback", res);
    }
    const feedbackSolve = feedback.feedbackSolves?.[0] || {};

    const formattedData = {
      id: feedback.id,
      parent_name: feedback.user?.name || null,
      parent_email: feedback.user?.email || null,
      parent_phone: feedback.user?.phone || null,
      reading_id: feedback?.reading?.id || null,
      reading_name: feedback?.reading?.title || null,
      comment: feedback.comment,
      rating: feedback.rating,
      is_important: feedback.is_important,
      feedback_category_id: feedback.feedback_category_id,
      status_feedback: feedback.status,
      is_active: feedback.is_active,
      created_at: feedback.created_at,
      solver_id: feedbackSolve.solver_id || null,
      solver_name: feedbackSolve.solver?.name || null,
      status_solve: feedbackSolve.status_solve || 0,
      comment_solve: feedbackSolve.comment_solve || null,
      confirmer_id: feedbackSolve.confirmer_id || null,
      confirmer_name: feedbackSolve.confirmer?.name || null,
      status_confirm: feedbackSolve.status_confirm || 0,
      comment_confirm: feedbackSolve.comment_confirm || null,
      deadline: feedbackSolve.deadline || null,
    };

   return messageManager.fetchSuccess("feedback", formattedData, res);
  } catch (error) {
    return messageManager.fetchFailed("feedback", res);
  }
};

exports.updateAssignFeedback = async (req, res) => {
  try {
    let {
      id: feedback_id,
      is_important,
      feedback_category_id,
      status_feedback,
      is_active,
      solver_id,
      confirmer_id,
      deadline,
    } = req.body;

    if (!feedback_id) {
      return res.status(400).json(
        messageManager.notFound("feedback", res)
      );
    }
    if (!solver_id) {
      return res.status(400).json(
        messageManager.notFound("teacher", res)
      );
    }
    if (!confirmer_id) {
      return res.status(400).json(
        messageManager.notFound("teacher", res)
      );
    }

    const sequelize = db.sequelize;
    const transaction = await sequelize.transaction();

    try {
      const resFeedback = await FeedbackRepo.updateFeedback(
        {
          id: feedback_id,
          is_important: is_important,
          feedback_category_id: feedback_category_id,
          status: status_feedback,
          is_active: is_active,
        },
        transaction
      );

      if (!resFeedback) {
        throw new Error("Error updating feedback solve.");
      }

      let feedbackSolve = await FeedbackSolveRepo.findAll({
        where: { feedback_id },
      });
      let isNeedSendEmail = false;
      isNeedSendEmail =
        feedbackSolve[0].solver_id !== solver_id ||
        feedbackSolve[0].confirmer_id !== confirmer_id ||
        feedbackSolve[0].deadline !== deadline;

      const resFeedbackSolve = await FeedbackSolveRepo.updateFeedbackResolve(
        {
          feedback_id: feedback_id,
          solver_id: solver_id,
          confirmer_id: confirmer_id,
          deadline: deadline,
        },
        transaction
      );

      if (!resFeedbackSolve) {
        throw new Error("Error updating feedback solve.");
      }

      let solver = await UserRepository.findById(solver_id);
      let confirmer = await UserRepository.findById(confirmer_id);

      if (isNeedSendEmail) {
        let feedback = await FeedbackRepo.findById(feedback_id);

        const emailContent = `
          <p>Bạn nhận được yêu cầu xử lý feedback với nội dung mới được cập nhật như sau:</p>
          <p><strong>${feedback.comment}</strong></p>
          <p>Hãy kiểm tra và xử lý feedback này trước thời gian hạn: ${deadline}</p>
          <p>Thông tin người xử lý:</p>
          <p>Người xử lý: ${solver.name} (${solver.email})</p>
          <p>Người xác nhận: ${confirmer.name} (${confirmer.email})</p>
        `;

        const emailSubject = "EngKid - Yêu Cầu Xử Lý Feedback";

        const emailSolveSent = await sendEmail(
          solver.email,
          emailSubject,
          emailContent
        );
        const emailConfirmSent = await sendEmail(
          confirmer.email,
          emailSubject,
          emailContent
        );

        if (!emailSolveSent || !emailConfirmSent) {
          throw new Error("Error sending email");
        }
      }

      await transaction.commit();
      return messageManager.updateSuccess("feedback",null, res);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    return res.json(messageManager.updateFailed("feedback"));
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return messageManager.notFound("feedback", res);
    }

    const feedback = await db.Feedback.findByPk(id);

    if (!feedback) {
      return messageManager.notFound("feedback", res);
    }

    let newActive = feedback.is_active === 1 ? 0 : 1;
    await feedback.update({ is_active: newActive });

    return messageManager.updateSuccess("feedback", null, res);
  } catch (error) {
    return messageManager.updateFailed("feedback", res);
  }
};

exports.checkTypeTeacher = async (req, res) => {
  try {
    const { feedback_id } = req.body;
    if (!feedback_id || isNaN(feedback_id)) {
      return messageManager.notFound("feedback", res);
    }

    const { id: teacher_id } = req.user || {};
    if (!teacher_id) {
      return messageManager.notFound("teacher", res); 
    }

    const feedbackSolve = await FeedbackSolveRepo.findAll({
      where: { feedback_id },
    });

    if (!feedbackSolve) {
      return messageManager.notFound("feedback", res);
    }

    let teacherType =
      feedbackSolve[0].solver_id === teacher_id
        ? 0
        : feedbackSolve[0].confirmer_id === teacher_id
        ? 1
        : -1;
    return messageManager.fetchSuccess("teacher", teacherType, res);
  } catch (error) {
    return messageManager.fetchFailed("teacher", res);
  }
};

exports.updateSolveFeedback = async (req, res) => {
  const {
    id: feedback_id,
    comment_solve,
    status_solve,
    comment_confirm,
    status_confirm,
  } = req.body;
  let { id: teacher_id } = req.user || {};

  if (!feedback_id ) {
    return messageManager.notFound("feedback", res);
  }

  if (!teacher_id) {
    return messageManager.notFound("teacher", res);
  }

  const feedbackSolve = await FeedbackSolveRepo.findAll({
    where: { feedback_id },
  });

  if (!feedbackSolve) {
    return messageManager.notFound("feedback", res);
  }

  let teacherType =
    feedbackSolve[0].solver_id === teacher_id
      ? 0
      : feedbackSolve[0].confirmer_id === teacher_id
      ? 1
      : -1;

  let payload =
    teacherType === 0
      ? { comment_solve, status_solve }
      : { comment_confirm, status_confirm };
  try {
    await FeedbackSolveRepo.update(feedbackSolve[0].id, payload);
    return messageManager.updateSuccess("feedback", null, res);
  } catch (error) {
    return messageManager.updateFailed("feedback", res);
  }
}