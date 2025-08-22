const { Feedback } = require("../models");
const { where, fn, col, Op } = require("sequelize");
const db = require("../models");

class FeedbackRepository {
  async sendFeedback({
    user_id,
    reading_id,
    comment,
    rating,
    feedback_category_id,
    is_important,
    status = 0,
    transaction
  }) {
    const feedback = await Feedback.create({
      user_id,
      reading_id,
      comment,
      rating,
      feedback_category_id,
      status,
      is_important,
    }, { transaction });
    return feedback;
  }

  async getFeedbacks({
    teacher_id = null,
    feedback_category_id = null,
    searchTerm = "",
    pageNumb = 1,
    pageSize = 10,
  }) {
    const offset = (pageNumb - 1) * pageSize;

    const whereClause = {};
    const include = [
      {
        model: db.User,
        as: "user",
        attributes: ["id", "name"],
        required: false,
      },
      {
        model: db.KidReading,
        as: "reading",
        attributes: ["id", "title"],
        required: false,
      },
      {
        model: db.FeedbackCategory,
        as: "feedbackCategory",
        attributes: ["id", "name"],
      },
      {
        model: db.FeedbackSolve,
        as: "feedbackSolves",
        attributes: ["solver_id", "status_solve", "confirmer_id", "status_confirm", "deadline"],
        required: !!teacher_id,
        where: teacher_id
          ? {
              [Op.or]: [
                { solver_id: teacher_id },
                { confirmer_id: teacher_id },
              ],
            }
          : undefined,
        include: [
          {
            model: db.User,
            as: "solver",
            attributes: ["id", "name"],
          },
          {
            model: db.User,
            as: "confirmer",
            attributes: ["id", "name"],
          },
        ],
      },
    ];

    if (feedback_category_id != null) {
      whereClause.feedback_category_id = feedback_category_id;
    }

    if (searchTerm) {
      whereClause.comment = {
        [Op.like]: `%${searchTerm}%`,
      };
    }

    const { rows, count } = await db.Feedback.findAndCountAll({
      where: whereClause,
      offset,
      limit: pageSize,
      order: [["created_at", "DESC"]],
      include,
      distinct: true,
    });

    return { rows, count };
  }

  async getFeedbackDetail(feedback_id) {
    const feedback = await db.Feedback.findOne({
      where: { id: feedback_id },
      include: [
        {
          model: db.User,
          as: "user",
          attributes: ["id", "name", "username", "email", "phone"]
        },
        {
          model: db.KidReading,
          as: "reading",
          attributes: ["id", "title"]
        },
        {
          model: db.FeedbackCategory,
          as: "feedbackCategory",
          attributes: ["id", "name"]
        },
        {
          model: db.FeedbackSolve,
          as: "feedbackSolves",
          include: [
            {
              model: db.User,
              as: "solver",
              attributes: ["id", "name"]
            },
            {
              model: db.User,
              as: "confirmer",
              attributes: ["id", "name"]
            }
          ]
        }
      ]
    });

    return feedback;
  }

  async updateFeedback(data, transaction) {
    const { id, ...updateData } = data;
    if (!id) {
      throw new Error("Feedback id is required for update.");
    }
    const feedback = await db.Feedback.findOne({ where: { id } });
    if (!feedback) {
      throw new Error("Feedback not found.");
    }

    const updatedFields = {};
    for (const key of Object.keys(feedback.dataValues)) {
      if (key === "id") continue;
      updatedFields[key] = updateData[key] !== undefined ? updateData[key] : feedback[key];
    }

    await db.Feedback.update(updatedFields, { where: { id }, transaction });
    
    return true;
  }

  async findById(id) {
    return db.Feedback.findByPk(id);
  }

}

module.exports = new FeedbackRepository();
