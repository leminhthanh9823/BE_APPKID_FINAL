const repository = require("../repositories/EBookCategoryRelations.repository");
const ebookRepo = require("../repositories/EBook.repository");
const categoryRepo = require("../repositories/EBookCategory.repository");
const messageManager = require("../helpers/MessageManager.helper.js");

async function getAll(req, res) {
  try {
    const { pageNumb = 1, pageSize = 10 } = req.body || {};
    const offset = (pageNumb - 1) * pageSize;
    const { rows, count } = await repository.findAllPaging(offset, pageSize);
    return messageManager.fetchSuccess(
      "ebookcategoryrelation",
      {
        records: rows,
        total_record: count,
        total_page: Math.ceil(count / pageSize),
      },
      res
    );
  } catch (error) {
    return messageManager.fetchFailed(
      "ebookcategoryrelation",
      res,
      error.message
    );
  }
}

async function getById(req, res) {
  try {
    const data = await repository.findById(req.params.id);
    if (!data) {
      return messageManager.notFound("ebookcategoryrelation", res);
    }
    return messageManager.fetchSuccess("ebookcategoryrelation", data, res);
  } catch (error) {
    return messageManager.fetchFailed(
      "ebookcategoryrelation",
      res,
      error.message
    );
  }
}

async function create(req, res) {
  try {
    const { elibrary_id, elibrary_categories_id } = req.body;

    if (!elibrary_id || !elibrary_categories_id) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    const ebook = await ebookRepo.findById(elibrary_id);
    if (!ebook) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    const category = await categoryRepo.findById(elibrary_categories_id);
    if (!category) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    const existed = await repository.findExisted(
      elibrary_categories_id,
      elibrary_id
    );
    if (existed && existed.length > 0) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    await repository.create(req.body);
    return messageManager.createSuccess("ebookcategoryrelation", null, res);
  } catch (error) {
    return messageManager.createFailed(
      "ebookcategoryrelation",
      res,
      error.message
    );
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { elibrary_id, elibrary_categories_id } = req.body;

    if (!elibrary_id || !elibrary_categories_id) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    const ebook = await ebookRepo.findById(elibrary_id);
    if (!ebook) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    const category = await categoryRepo.findById(elibrary_categories_id);
    if (!category) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    const existed = await repository.findDuplicate(
      elibrary_categories_id,
      elibrary_id,
      id
    );
    if (existed && existed.length > 0) {
      return messageManager.validationFailed(
        "ebookcategoryrelation",
        ["validate ebookcategoryrelation failed"],
        res
      );
    }

    const [updated] = await repository.update(id, req.body);
    if (!updated) {
      return messageManager.notFound("ebookcategoryrelation", res);
    }

    return messageManager.updateSuccess("ebookcategoryrelation", res);
  } catch (error) {
    return messageManager.updateFailed(
      "ebookcategoryrelation",
      res,
      error.message
    );
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const deleted = await repository.delete(id);

    if (!deleted) {
      return messageManager.notFound("ebookcategoryrelation", res);
    }

    return messageManager.deleteSuccess("ebookcategoryrelation", res);
  } catch (error) {
    return messageManager.deleteFailed(
      "ebookcategoryrelation",
      res,
      error.message
    );
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
