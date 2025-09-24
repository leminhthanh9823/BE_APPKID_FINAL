const repository = require("../repositories/StudentReading.repository.js");
class StudentStarsController {
    async getStarsByLearningPathCategories(req, res) {
        try {
            const { kid_student_id, learning_path_id } = req.params;
            
            if (!kid_student_id || !learning_path_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required parameters'
                });
            }

            const result = await repository.getStarsByLearningPathCategories(
                parseInt(kid_student_id),
                parseInt(learning_path_id)
            );

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error in getStarsByLearningPathCategories:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
}

module.exports = new StudentStarsController();
