const KidReadingRepository = require("../repositories/KidReading.repository.js");
const KidStudentRepository = require("../repositories/KidStudent.repository.js");
const repository = require("../repositories/KidStudent.repository.js");
const StudentReadingRepository = require("../repositories/StudentReading.repository.js");
const UserRepository = require("../repositories/User.repository.js");
const db = require("../models");
const messageManager = require("../helpers/MessageManager.helper.js");
const { uploadToMinIO } = require("../helpers/UploadToMinIO.helper.js");

const validateKidStudentData = (data) => {
  if (!data.name || data.name.trim() === "") {
    return "Name is required";
  }
  if (!data.gender) {
    return "Gender is required";
  }
  if (!data.dob) {
    return "Date of birth is required";
  }
  if (!data.grade_id || isNaN(data.grade_id) || data.grade_id < 1 || data.grade_id > 5) {
    return "Please select a valid grade";
  }
  return null;
};

async function getAll(req, res) {
  try {
    const { pageNumb = 1, pageSize = 10 } = req.body || {};
    const offset = (pageNumb - 1) * pageSize;
    const { rows, count } = await repository.findAllPaging(offset, pageSize);
    return messageManager.fetchSuccess("student", {
      records: rows,
      total_record: count,
      total_page: Math.ceil(count / pageSize),
    });
  } catch (error) {
    return messageManager.fetchFailed("student");
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const data = await repository.findById(id);
    if (!data) {
      return messageManager.notFound("student");
    }
    return messageManager.fetchSuccess("student", data);
  } catch (error) {
    return messageManager.fetchFailed("student");
  }
}

async function getByGrade(req, res) {
  try {
    const { grade_id } = req.params;
    const data = await repository.findByGrade(grade_id);
    if (!data) {
      return messageManager.notFound("student", res);
    }
    return messageManager.fetchSuccess("student", data, res);
  } catch (error) {
    return messageManager.fetchFailed("student", res);
  }
}

async function getByUserId(req, res) {
  try {
    const { user_id } = req.params;
    const data = await repository.findByUserId(user_id);
    if (!data) {
      return messageManager.notFound("student");
    }
    return messageManager.fetchSuccess("student", data);
  } catch (error) {
    return messageManager.fetchFailed("student");
  }
}

async function getByParentId(req, res) {
  try {
    const { kid_parent_id } = req.params;
    if (!kid_parent_id || isNaN(kid_parent_id)) {
      return messageManager.notFound("parent");
    }
    const data = await repository.findByParentId(kid_parent_id);
    return messageManager.fetchSuccess("student", data);
  } catch (error) {
    return messageManager.fetchFailed("student");
  }
}
async function getByParentIdM(req, res) {
  try {
    const { kid_parent_id } = req.params;
    if (!kid_parent_id || isNaN(kid_parent_id)) {
      return messageManager.notFound("parent");
    }
    const data = await repository.findByParentIdM(kid_parent_id);
    const child_profiles = data.map((data) => {
      return {
        id: data.id,
        grade_id: data.grade_id,
        is_passed_survey: data.is_passed_survey,
        created_at: data.created_at,
        updated_at: data.updated_at,
        name: data.name,
        image: data.image,
      };
    });
    return messageManager.fetchSuccess("student", child_profiles);
  } catch (error) {
    return messageManager.fetchFailed("student");
  }
}

async function parentUpdateChild(req, res) {
  try {
    const { name, gender, dob, grade_id } = req.body;
    console.log(req.body);
    console.log(req.file);
    const id = req.params.id;
    if (!id || isNaN(id)) {
      return messageManager.notFound("student", res);
    }
    const exists = await db.KidStudent.findByPk(id);
    if (!exists) {
      return messageManager.notFound("user", res);
    }
    let imageUrl = exists.image;
    if (req.file) {
      imageUrl = await uploadToMinIO(req.file, "kid_student");
    }
    const updatedChild = await KidStudentRepository.updateById(id, {
      grade_id: grade_id,
      name: name,
      image: imageUrl,
      gender: gender,
      dob: dob,
    });
    return messageManager.updateSuccess("student", updatedChild, res);
  } catch (error) {
    return messageManager.updateFailed("student", res);
  }
}

async function parentCreateChild(req, res) {
  try {
    const { name, image, gender, dob, grade_id } = req.body;
    const validationError = validateKidStudentData({ name, gender, dob, grade_id });
    if (validationError) {
      return messageManager.validationFailed("student", validationError);
    }
    const authUser = req.user;
    const newChild = await KidStudentRepository.create({
      grade_id: grade_id,
      kid_parent_id: authUser.id,
      is_passed_survey: true,
      name: name,
      image: image,
      gender: gender,
      dob: dob,
    });
    return messageManager.createSuccess("student", newChild, res);
  } catch (error) {
    return messageManager.createFailed("student", res);
  }
}

async function getStudentsParents(req, res) {
  try {
    const { searchTerm, pageNumb = 1, pageSize = 10 } = req.body;
    const offset = (pageNumb - 1) * pageSize;
    const { rows, total_record } =
      await KidStudentRepository.findStudentsWithParents(
        offset,
        pageSize,
        searchTerm,
      );
    let result = rows.map((row) => {
      return {
        student_id: row.id,
        student_name: row.name,
        student_grade: row.grade_id,
        student_image: row.image,
        student_dob: row.dob,
        parent_id: row.parent ? row.parent.id : null,
        parent_name: row.parent ? row.parent.name : null,
        parent_phone: row.parent ? row.parent.phone : null,
        parent_email: row.parent ? row.parent.email : null,
      };
    });
    
    let completedList = await StudentReadingRepository.getCompletedCountsByStudentId(
      result.map((r) => r.student_id)
    );
    
    result = result.map((student) => {
      let res = completedList.find((p) => p.student_id === student.student_id);
      let completed_count = res ? res.completed_count : 0;
      return {
        ...student,
        completed_count: completed_count
      };
    });
    return messageManager.fetchSuccess("student", {
      records: result,
      total_record: total_record,
      total_page: Math.ceil(total_record / pageSize),
    },res);
  } catch (error) {
    return messageManager.fetchFailed("student");
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return messageManager.notFound("student", res);
    }
    const student = await db.KidStudent.findByPk(id);
    if (!student) {
      return messageManager.notFound("student", res);
    }
    const newStatus = student.is_active === 1 ? 0 : 1;
    await student.update({ is_active: newStatus });
    return messageManager.updateSuccess("student", student, res);
  } catch (error) {
    return messageManager.fetchFailed("student", res, error);
  }
}

module.exports = {
  getAll,
  getById,
  getByUserId,
  getByParentId,
  getByParentIdM,
  getByGrade,
  parentCreateChild,
  getStudentsParents,
  toggleStatus,
  parentUpdateChild
};
