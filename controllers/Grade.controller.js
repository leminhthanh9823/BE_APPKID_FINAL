async function getAll(req, res) {
  const data = [1, 2, 3, 4, 5];
    res.json({
      success: true,
      status: 200,
      data,
    });
}
module.exports = {
    getAll
}