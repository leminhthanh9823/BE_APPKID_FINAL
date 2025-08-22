const repository = require("../repositories/ReadingCategoryRelations.repository.js");
const messageManager = require("../helpers/MessageManager.helper.js");

async function getAll(req, res) {
  try {
    const data = await repository.findAll();
    res.json({
      ...messageManager.fetchSuccess("readingcategoryrelation"),
      data: data,
    });
  } catch (error) {
    res.json(messageManager.fetchFailed("readingcategoryrelation"));
  }
}

async function getById(req, res) {
  try {
    const { reading_id, category_id } = req.params;
    const data = await repository.findById(reading_id, category_id);
    if (!data) {
      return res.json(messageManager.notFound("readingcategoryrelation"));
    }
    res.json({
      ...messageManager.fetchSuccess("readingcategoryrelation"),
      data: data,
    });
  } catch (error) {
    res.json(messageManager.fetchFailed("readingcategoryrelation"));
  }
}

module.exports = {
  getAll,
  getById,
};
