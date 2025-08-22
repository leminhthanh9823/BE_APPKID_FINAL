const { EBookCategoryRelation } = require('../models');
const { where, Op, ne, fn, col } = require('sequelize');

class EBookCategoryRelationsRepository {
    async findAll() {
        return EBookCategoryRelation.findAll();
    }

    async findById(id) {
        return EBookCategoryRelation.findByPk(id);
    }
    async findDuplicate(cateId, ebookId, currentId) {
        return EBookCategoryRelation.findAll({
            where: {
                elibrary_categories_id: cateId,
                elibrary_id: ebookId,
                id: { [Op.ne]: currentId }
            }
        });
    }

    async create(data) {
        return EBookCategoryRelation.create(data);
    }

    async update(id, data) {
        return EBookCategoryRelation.update(data, { where: { id } });
    }

    async delete(id) {
        return EBookCategoryRelation.destroy({ where: { id } });
    }
    async deleteByCondition(where) {
        return EBookCategoryRelation.destroy({ where });
    }
    async findAllPaging(offset = 0, limit = 10) {
        const whereCondition = {};
        const { rows, count } = await EBookCategoryRelation.findAndCountAll({
            where: whereCondition,
            offset,
            limit,
            order: [["updated_at", "DESC"]],
        });

        return { rows, count };
    }
}

module.exports = new EBookCategoryRelationsRepository();