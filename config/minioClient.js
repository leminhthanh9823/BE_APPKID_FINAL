const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: "s3.engkid.io.vn",
  port: 443,
  useSSL: true,
  accessKey: process.env.MINIO_ACCESSKEY,
  secretKey: process.env.MINIO_SECRETKEY,
});

module.exports = minioClient;
