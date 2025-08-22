const { FeedbackSolve } = require("../models");

class FeedbackSolveRepository {
  async createFeedbackSolve({
    feedback_id,
    transaction
  }) {
    const res = await FeedbackSolve.create({
      feedback_id,
      status_solve: 0,
      status_confirm: 0,
      is_active: 1,
    }, { transaction });
    return res;
  }

  async updateFeedbackResolve(data, transaction){
    const { feedback_id, ...updateData } = data;
    
    if (!feedback_id) {
      throw new Error("Feedback id is required for update.");
    }

    const feedback = await FeedbackSolve.findOne({ where: { feedback_id: feedback_id } });
    if (!feedback) {
      throw new Error("Feedback solve not found.");
    }

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const [updatedRowsCount] = await FeedbackSolve.update(
      updateData, 
      { 
        where: { feedback_id: feedback_id }, 
        transaction 
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error("Nothing to update.");
    }

    return true;
  }

  async findAll(condition = {}) {
    return FeedbackSolve.findAll(condition);
  }

  async update(id, data) {
    return FeedbackSolve.update(data, { where: { id } });
  }
}

exports.FeedbackSolveRepository = new FeedbackSolveRepository();