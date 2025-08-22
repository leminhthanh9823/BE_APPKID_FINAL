const { StudentEBookRelation } = require('../models');
const { where } = require('sequelize');
class StudentEbookRelationsRepository {
  async findAll(condition = {}) {
    return StudentEBookRelation.findAll(condition);
  }

  async findById(id) {
    return StudentEBookRelation.findByPk(id);
  }

  async create(data) {
    return StudentEBookRelation.create(data);
  }

  async update(id, data) {
    return StudentEBookRelationsupdate(data, { where: { id } });
  }

  async delete(id) {
    return StudentEBookRelation.destroy({ where: { id } });
  }

  async deleteByCondition(where) {
    return StudentEBookRelation.destroy({ where });
  }
}

module.exports = new StudentEbookRelationsRepository();