const minioClient = require("../config/minioClient");
const BUCKET = "test";
const uploadToMinIO = async (file, fileName) => {
  const extension = file.originalname.split(".").pop();
  const objectName = `${fileName}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}.${extension}`;
  try {
    await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    console.error('Details:', err.code, err.resource, err.requestId, err.region);
    throw new Error("Failed to upload file to MinIO");
  }
  return `https://s3.engkid.io.vn/${BUCKET}/${objectName}`;
};
module.exports = {
  uploadToMinIO,
};
