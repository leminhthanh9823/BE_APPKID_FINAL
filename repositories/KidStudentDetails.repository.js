const { StudentReadingDetail} = require("../models");

async function checkIsExisted(question_id) {
  let exists = await StudentReadingDetail.findOne({ where: { question_id } });
  return !!exists;
}

const KidStudentDetailsRepository = {
  checkIsExisted,
};
module.exports = KidStudentDetailsRepository;