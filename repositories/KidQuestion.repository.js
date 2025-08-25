const QuestionHelper = require("../helpers/GetQuestionTypeCode");
const { Question, Option, KidStudentDetails} = require("../models");

//cms
async function findAllPaging(offset = 0, limit = 10, readingId, searchTerm = "") {
  const whereCondition = searchTerm
    ? {
      title: {
        [Op.like]: `%${searchTerm}%`,
      },
    }
    : {};

  whereCondition.kid_reading_id = readingId;

  const { rows, count } = await Question.findAndCountAll({
    where: whereCondition,
    offset,
    limit,
    order: [["updated_at", "DESC"]],
  });

  return { rows, count };
}

//cms
async function getQuestionAndOptionsById(id) {
  try {
    const question = await Question.findByPk(id, {
      include: [
        {
          model: Option,
          as: 'options',
          attributes: ['id', 'option', 'isCorrect', 'key_position', 'is_active']
        }
      ]
    });
    return question;

  } catch (error) {
    throw error;
  }
}

//cms
async function updateQuestionInfo(id, questionData, transaction = null) {
  try {
    await Question.update(
      {
        ...questionData
      },
      {
        where: { id },
        transaction
      }
    )
    return true;
  } catch (error) {
    throw error;
  }
}

//mobile
async function getQuestionsByReadingId(readingId) {
  try {
    const questions = await Question.findAll({
      where: { kid_reading_id: readingId },
      include: [
        {
          model: Option,
          as: 'options',
          attributes: ['id', 'option', 'isCorrect', 'key_position']
        }
      ],
      logging: console.log
    });
    const result = questions.map((q) => {
      const { typeCode } = QuestionHelper.getQuestionTypeInfo(q.question_type);

      return {
        questionId: q.id,
        type: q.question_type,
        type_code: typeCode,
        question: q.question,
        level: q.question_level_id.toString(),
        options: q.options.map((opt) => ({
          option_id: opt.id,
          option: opt.option,
          is_correct: opt.isCorrect.toString(),
          image: ''
        })),
        achievedMark: 0.0,
        background: '',
        audio: ''
      };
    });
    return result;
  } catch (error) {
    throw error;
  }
}

const KidQuestionRepository = {
  findAllPaging,
  getQuestionAndOptionsById,
  updateQuestionInfo,
  getQuestionsByReadingId,
};
module.exports = KidQuestionRepository;