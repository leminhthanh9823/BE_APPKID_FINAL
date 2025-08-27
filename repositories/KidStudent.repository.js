const { KidStudent, User } = require("../models");
const { where, Op } = require("sequelize");
class KidStudentRepository {
  async findAll() {
    return KidStudent.findAll({
      include: [{ model: User, as: "parent" }],
    });
  }

  async updateById(id, data) {
  const student = await KidStudent.findByPk(id)
  if (!student) {
    throw new Error(`Không tìm thấy học sinh với ID ${id}`);
  }
  return student.update(data);
}

  async findAllPaging(offset = 0, limit = 10, searchTerm = "") {
    let includeCondition = [
      {
        model: User,
        as: "user",
        required: true,
        where: {},
      },
    ];
    if (searchTerm) {
      includeCondition[0].where = {
        [Op.or]: [
          { email: { [Op.like]: `%${searchTerm}%` } },
          { name: { [Op.like]: `%${searchTerm}%` } },
        ],
      };
    }

    const { rows, count } = await KidStudent.findAndCountAll({
      include: includeCondition,
      offset,
      limit,
      order: [["updated_at", "DESC"]],
    });

    return { rows, count };
  }

  async findById(id) {
    return KidStudent.findByPk(id, {
      include: [{ model: User, as: "parent" }],
    });
  }

  async findByGrade(grade_id) {
    return KidStudent.findAll({
      where: { grade_id },
      include: [{ model: User, as: "parent" }],
    });
  }

  async findByParentId(kid_parent_id) {
    return KidStudent.findAll({
      where: { kid_parent_id: kid_parent_id },
      include: [{ model: User, as: "parent" }],
    });
  }

  async findByUserId(user_id) {
    return KidStudent.findAll({
      where: { kid_parent_id: user_id },
      include: [{ model: User, as: "parent" }],
    });
  }
  async findByParentIdM(kid_parent_id) {
    return KidStudent.findAll({
      where: { kid_parent_id },
    });
  }

  async findStudentsWithParents(
    offset = 0,
    limit = 10,
    searchTerm = "",
    grade_id = null
  ) {
    let whereCondition = {};

    if (grade_id) {
      whereCondition.grade_id = grade_id;
    }

    let searchConditions = {};
    if (searchTerm && searchTerm.trim() !== "") {
      const searchValue = searchTerm.trim();
      searchConditions = {
        [Op.or]: [
          { name: { [Op.like]: `%${searchValue}%` } },
          { "$parent.name$": { [Op.like]: `%${searchValue}%` } },
          { "$parent.email$": { [Op.like]: `%${searchValue}%` } },
          { "$parent.phone$": { [Op.like]: `%${searchValue}%` } },
        ],
      };
    }

    const finalWhereConditions = {
      ...whereCondition,
      ...searchConditions,
    };

    const { rows, count } = await KidStudent.findAndCountAll({
      where: finalWhereConditions,
      include: [
        {
          model: User,
          as: "parent",
          attributes: ["id", "name", "phone", "email"],
          required: false,
        },
      ],
      offset,
      limit,
      order: [
        ["grade_id", "ASC"],
        ["name", "ASC"],
      ],
      distinct: true,
    });

    return { rows, total_record: count };
  }

  async findByIds(ids) {
    return KidStudent.findAll({
      where: {
        id: { [Op.in]: ids }
      },
      attributes: ['id', 'name', 'image', 'gender', 'dob', 'grade_id']
    });
  }

  async create(data) {
    return KidStudent.create(data);
  }
}

module.exports = new KidStudentRepository();
