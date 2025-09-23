const { User } = require("../models");
const { where, Op } = require("sequelize");
class UserRepository {
  async getAllParents() {
    // role_id = 3 is assumed to be parent
    return User.findAll({
      where: { role_id: 3 },
      attributes: ["id", "name", "email", "phone"],
      order: [["created_at", "DESC"]],
    });
  }
  async findAll(condition = {}) {
    return User.findAll(condition);
  }

  async findById(id) {
    return User.findByPk(id);
  }

  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }
  async findByPhone(phone) {
    return User.findOne({ where: { phone: phone } });
  }
  async findByUsername(username) {
    return User.findOne({ where: { username } });
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, data) {
    return User.update(data, { where: { id } });
  }

  async delete(id) {
    return User.destroy({ where: { id } });
  }
  async findByRefreshToken(refreshToken) {
    return User.findOne({ where: { refresh_token: refreshToken } });
  }
  async updateRefreshToken(userId, refreshToken, expires) {
    return User.update(
      {
        refresh_token: refreshToken,
        refresh_token_expires: expires,
      },
      { where: { id: userId } }
    );
  }
  async findAllPaging(offset, limit, searchTerm, role_id, userId) {
    let whereClause = {};
    
    whereClause.id = { [Op.ne]: userId };
    
    if (role_id) {
      whereClause.role_id = role_id;
    }

    if (searchTerm && searchTerm.trim() !== "") {
      const searchValue = searchTerm.trim();
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchValue}%` } },
        { email: { [Op.like]: `%${searchValue}%` } },
        { username: { [Op.like]: `%${searchValue}%` } },
        { phone: { [Op.like]: `%${searchValue}%` } },
      ];
    }

    const result = await User.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [["created_at", "DESC"]],
      attributes: { exclude: ["password", "refresh_token"] },
    });

    return result;
  }
}
module.exports = new UserRepository();
