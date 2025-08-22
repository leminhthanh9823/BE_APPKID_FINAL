const { Option } = require("../models");
const { Op } = require("sequelize");

async function updateById(id, optionData, transaction = null) {
  try {
    const option = await Option.findOne({ where: { id }, transaction });
    if (!option) throw new Error("Option not found");

    await option.update(optionData, { transaction });
    return option;
  } catch (error) {
    throw error;
  }
}

async function deleteOptionsNotInIds(kid_question_id, newOptionIds = [], transaction = null) {
  try {
    const where = {
      kid_question_id,
      ...(newOptionIds.length > 0 && { id: { [Op.notIn]: newOptionIds } })
    };
    await Option.destroy({ where, transaction });
  } catch (error) {
    throw error;
  }
}

async function bulkCreateOptions(newOptions, kid_question_id, transaction = null) {
  try {
    if (newOptions.length > 0) {
      const optionData = newOptions.map(opt => ({
        kid_question_id,
        option: opt.option,
        isCorrect: opt.isCorrect || 0,
        key_position: opt.key_position || 0,
        is_active: opt.is_active || 1
      }));
      await Option.bulkCreate(optionData, { transaction });
    }
  } catch (error) {
    throw error;
  }
}

const OptionRepository = {
  updateById,
  deleteOptionsNotInIds,
  bulkCreateOptions
};
module.exports = OptionRepository;
