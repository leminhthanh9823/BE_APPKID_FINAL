function getQuestionTypeInfo(questionType) {
  switch (questionType) {
    case 'Video':
      return { typeCode: 'V' };
      case 'Multiple Choice':
      return { typeCode: 'M' };
    case 'Single Choice':
      return { typeCode: 'S' };
    case 'Matched':
      return { typeCode: 'X' };
    case 'Fill Word':
      return { typeCode: 'D' };
    case 'Fill Blank':
      return { typeCode: 'L' };
    case 'Jigsaw Puzzle':
      return { typeCode: 'P' };
    case 'Fill Table':
      return { typeCode: 'T' };
    case 'Crossword Puzzle':
      return { typeCode: 'CWP' };
    case 'Reading':
      return { typeCode: 'read' };
    default:
      return { typeCode: '' };
  }
}
const QuestionHelper = {
  getQuestionTypeInfo
};
module.exports = QuestionHelper;