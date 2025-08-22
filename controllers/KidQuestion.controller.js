const db = require("../models");
const messageManager = require("../helpers/MessageManager.helper.js");
const KidStudentDetailsRepository = require("../repositories/KidStudentDetails.repository.js");
const KidQuestionRepository = require("../repositories/KidQuestion.repository");

const validateQuestionData = (data) => {
  if (!data.question || data.question.trim() === "") {
    return "Question is required";
  }
  if (!data.question_type || data.question_type.trim() === "") {
    return "Question type is required";
  }
  if (!data.kid_reading_id) {
    return "Please select a reading";
  } else if (isNaN(data.kid_reading_id)) {
    return "Invalid reading";
  }
  if (
    data.number_of_options &&
    (isNaN(data.number_of_options) || data.number_of_options < 2)
  ) {
    return "Number of options must be at least 2";
  }
  if (
    data.number_of_ans &&
    (isNaN(data.number_of_ans) || data.number_of_ans < 1)
  ) {
    return "Number of correct answers must be at least 1";
  }
  return null;
};

async function getAll(req, res) {
  try {
    const {
      pageNumb = 1,
      pageSize = 10,
      searchTerm = "",
      kid_reading_id = null,
      grade_id = null,
      is_active = null,
    } = req.body || {};

    const page = parseInt(pageNumb);
    const limit = parseInt(pageSize);
    const offset = (page - 1) * limit;

    const where = {};

    if (searchTerm) {
      where.question = { [db.Sequelize.Op.like]: `%${searchTerm}%` };
    }

    if (kid_reading_id) {
      where.kid_reading_id = kid_reading_id;
    }

    if (grade_id) {
      where.grade_id = grade_id;
    }

    if (is_active !== null && is_active !== undefined) {
      where.is_active = is_active;
    }

    const { count: total_record, rows: records } =
      await db.Question.findAndCountAll({
        where,
        offset,
        limit,
        distinct: true,
        include: [
          {
            model: db.Option,
            as: "options",
            attributes: ["id", "option", "isCorrect"],
          },
          {
            model: db.KidReading,
            as: "kid_reading",
            attributes: ["id", "title"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

    const total_page = Math.ceil(total_record / limit);

    return messageManager.fetchSuccess("question", {
      records,
      total_record,
      total_page,
    }, res);
  } catch (error) {
  return messageManager.fetchFailed("question", res);
  }
}

async function getQuestionsByReadingId(req, res) {
  try {
    const { readingId } = req.body;
    const data = await KidQuestionRepository.getQuestionsByReadingId(readingId);
    return res.status(200).json({
      success: true,
      data: {
        records: data
      },
      status: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Error when getting questions by reading ID',
      error: error.message
    });
  }
}

async function getByReadingId(req, res) {
  try {
    const { kid_reading_id } = req.params;

    if (!kid_reading_id || isNaN(kid_reading_id)) {
      return messageManager.notFound("question", res);
    }

    const questions = await db.Question.findAll({
      where: { kid_reading_id },
      include: [
        {
          model: db.Option,
          as: "options",
          attributes: ["id", "option", "isCorrect"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return messageManager.fetchSuccess("question", { records: questions }, res);
  } catch (error) {
    return messageManager.fetchFailed("question", res);
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("question", res);
    }

    const question = await db.Question.findByPk(id, {
      include: [
        {
          model: db.Option,
          as: "options",
          attributes: ["id", "option", "isCorrect"],
        },
        {
          model: db.KidReading,
          as: "kid_reading",
          attributes: ["id", "title"],
        },
      ],
    });

    if (!question) {
      return messageManager.notFound("question", res);
    }
    return messageManager.fetchSuccess("question", question, res);
  } catch (error) {
  return messageManager.fetchFailed("question", res);
  }
}

async function create(req, res) {
  try {
    const validationError = validateQuestionData(req.body);
    if (validationError) {
      return messageManager.validationFailed("question", res, validationError);
    }
    const readingExists = await db.KidReading.findByPk(req.body.kid_reading_id);
    if (!readingExists) {
      return messageManager.notFound("reading", res);
    }
    const created = await db.Question.create(req.body);
  return messageManager.createSuccess("question", created, res);
  } catch (error) {
  return messageManager.createFailed("question", res);
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("question", res);
    }
    const validationError = validateQuestionData(req.body);
    if (validationError) {
      return messageManager.validationFailed("question", res, validationError);
    }
    const exists = await db.Question.findByPk(id);
    if (!exists) {
      return messageManager.notFound("question", res);
    }
    await db.Question.update(req.body, { where: { id } });
  return messageManager.updateSuccess("question", req.body, res);
  } catch (error) {
  return messageManager.updateFailed("question", res);
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("question", res);
    }
    const exists = await db.Question.findByPk(id);
    if (!exists) {
      return messageManager.notFound("question", res);
    }
    await db.Option.destroy({ where: { kid_question_id: id } });
    await db.Question.destroy({ where: { id } });
  return messageManager.deleteSuccess("question", res);
  } catch (error) {
  return messageManager.deleteFailed("question", res);
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("question", res);
    }
    const question = await db.Question.findByPk(id);
    if (!question) {
      return messageManager.notFound("question", res);
    }
    const newStatus = question.is_active === 1 ? 0 : 1;
    await question.update({ is_active: newStatus });
  return messageManager.updateSuccess("question", question, res);
  } catch (error) {
  return messageManager.updateFailed("question", res);
  }
}

async function getQuestionAndOptionsById(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("question", res);
    }
    const question = await db.Question.findByPk(id, {
      include: [
        {
          model: db.Option,
          as: "options",
          attributes: ["id", "option", "isCorrect"],
        },
      ],
    });
    if (!question) {
      return messageManager.notFound("question", res);
    }
    return messageManager.fetchSuccess("question", question, res);
  } catch (error) {
  return messageManager.fetchFailed("question", res);
  }
}

async function getByIdCMS(req, res) {
  try {
    const { id } = req.body;
    if (!id || isNaN(id)) {
      return messageManager.notFound("question", res);
    }
    const question = await db.Question.findByPk(id, {
      include: [
        {
          model: db.Option,
          as: "options",
          attributes: ["id", "option", "isCorrect"],
        },
        {
          model: db.KidReading,
          as: "kid_reading",
          attributes: ["id", "title"],
        },
      ],
    });
    if (!question) {
      return messageManager.notFound("question", res);
    }
    return messageManager.fetchSuccess("question", question, res);
  } catch (error) {
  return messageManager.fetchFailed("question", res);
  }
}

async function getByReadingIdCMS(req, res) {
  try {
    const { readingId, kid_reading_id } = req.body;
    const targetReadingId = readingId || kid_reading_id;
    if (!targetReadingId || isNaN(targetReadingId)) {
      return messageManager.notFound("question", res);
    }
    const questions = await db.Question.findAll({
      where: { kid_reading_id: targetReadingId },
      include: [
        {
          model: db.Option,
          as: "options",
          attributes: ["id", "option", "isCorrect"],
        },
      ],
      order: [["created_at", "ASC"]],
    });
  return messageManager.fetchSuccess("question", { records: questions }, res);
  } catch (error) {
  return messageManager.fetchFailed("question", res);
  }
}

async function checkIsPracticed(req, res) {
  try {
    const { id } = req.body || {};
    let isPracticed = await KidStudentDetailsRepository.checkIsExisted(id);
  return messageManager.fetchSuccess("question", { isPracticed }, res);
  } catch (error) {
  return messageManager.fetchFailed("question", res, error.message);
  }
}
module.exports = {
  getAll,
  getById,
  getByReadingId,
  getQuestionsByReadingId,
  create,
  update,
  remove,
  toggleStatus,
  getQuestionAndOptionsById,
  getByIdCMS,
  getByReadingIdCMS,
  checkIsPracticed,
};
