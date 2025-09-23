const db = require("../models");
const messageManager = require("../helpers/MessageManager.helper.js");
const KidStudentDetailsRepository = require("../repositories/KidStudentDetails.repository.js");
const KidQuestionRepository = require("../repositories/KidQuestion.repository");
const KidReadingRepository = require("../repositories/KidReading.repository.js");
const OptionRepository = require("../repositories/Option.repository.js");
const StudentReadingRepository = require("../repositories/StudentReading.repository.js");
const KidQuestion = db.Question;
const Option = db.Option;

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

async function createQuestionAndOptions(req, res) {
  try {
    const {
      question_level_id,
      kid_reading_id,
      question_category_id,
      question,
      question_type,
      number_of_ans,
      number_of_qus,
      connection,
      options,
    } = req.body;

    const validationError = validateQuestionData(req.body);

    if (validationError) {
      return messageManager.validationFailed("question", res, validationError);
    }

    const sequelize = db.sequelize;
    const transaction = await sequelize.transaction();
    try {
      const newQuestion = await KidQuestion.create(
        {
          question_level_id,
          kid_reading_id,
          question_category_id,
          question,
          question_type,
          number_of_options: options.length,
          number_of_ans,
          number_of_qus,
          connection,
        },
        { transaction }
      );
     
      const optionData = options.map((opt) => ({
        kid_question_id: newQuestion.id,
        option: opt.option,
        isCorrect: opt.isCorrect || 0,
        type: opt.type || 0,
        key_position: opt.key_position || 0,
      }));
      await Option.bulkCreate(optionData, { transaction });

      await transaction.commit();

      return messageManager.createSuccess("question", newQuestion, res);
    } catch (err) {
      await transaction.rollback();
      throw new Error(err.message);
    }
  } catch (err) {
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
    let isPracticed = await StudentReadingRepository.checkIsPracticed(id);
    return messageManager.fetchSuccess("question", { isPracticed }, res);
  } catch (error) {
  return messageManager.fetchFailed("question", res, error.message);
  }
}

//cms
async function updateQuestionAndOptions(req, res) {
  try {
    const {
      id,
      kid_reading_id,
    } = req.body;
    if (!id || isNaN(id)) {
      return messageManager.validationFailed("question", res, "Question is not valid");
    }

    if (!kid_reading_id || isNaN(kid_reading_id)) {
      return messageManager.validationFailed("question", res, "Reading is not valid");
    }

    let isPracticed = await StudentReadingRepository.checkIsPracticed(kid_reading_id);
    if (isPracticed) {
      let {
        question_level_id,
        is_active
      } = req.body;
      await KidQuestionRepository.updateQuestionInfo(
        id,
        {
          question_level_id,
          is_active,
        }
      );
    } else {
      let {
        question_level_id,
        question,
        question_type,
        number_of_ans,
        number_of_qus,
        is_active,
        connection,
        options,
      } = req.body;
      const sequelize = db.sequelize;
      const transaction = await sequelize.transaction();
      try {
        await KidQuestionRepository.updateQuestionInfo(
          id,
          {
            question_level_id,
            question,
            question_type,
            number_of_options: options.length,
            number_of_ans,
            number_of_qus,
            is_active,
            connection,
          },
          transaction
        );

        // // Lấy danh sách id của options mới từ request
        let newOptionIds = options.filter((opt) => opt.id).map((opt) => opt.id);

        // Xóa các options không có trong danh sách mới
        await OptionRepository.deleteOptionsNotInIds(
          id,
          newOptionIds,
          transaction
        );

        // Cập nhật các options đã tồn tại
        const updateOptionPromises = options
          .filter((opt) => opt.id)
          .map((opt) =>
            OptionRepository.updateById(
              opt.id,
              {
                option: opt.option,
                isCorrect: opt.isCorrect || 0,
                key_position: opt.key_position || 0,
                is_active: opt.is_active || 0,
              },
              transaction
            )
          );
        await Promise.all(updateOptionPromises);

        // // Thêm mới các options
        let newOptions = options.filter((opt) => !opt.id);
        await OptionRepository.bulkCreateOptions(newOptions, id, transaction);

        await transaction.commit();

      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }
    return messageManager.updateSuccess("question", req.body, res);

  } catch (error) {
    console.log(error)
    return messageManager.updateFailed("question", res);
  }
};

module.exports = {
  getAll,
  getById,
  getByReadingId,
  getQuestionsByReadingId,
  createQuestionAndOptions,
  updateQuestionAndOptions,
  update,
  remove,
  toggleStatus,
  getQuestionAndOptionsById,
  getByIdCMS,
  getByReadingIdCMS,
  checkIsPracticed,
};
