const express = require("express");
const cors = require("cors");
const jwtMiddleware = require('./middlewares/Auth.middleware');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(jwtMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});