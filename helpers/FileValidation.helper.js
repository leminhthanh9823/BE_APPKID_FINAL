/**
 * File validation helper for uploads
 */

const validateFileType = (file, allowedTypes, fieldName) => {
  if (!file) return null;

  const allowedMimeTypes = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    video: [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
      "video/mkv",
      "video/quicktime",
    ],
  };

  const validTypes = allowedTypes.flatMap(
    (type) => allowedMimeTypes[type] || []
  );

  if (!validTypes.includes(file.mimetype)) {
    return `${fieldName} must be ${allowedTypes.join(" or ")} file`;
  }

  return null;
};

const validateFileSize = (file, maxSizeMB, fieldName) => {
  if (!file) return null;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return `${fieldName} size must be less than ${maxSizeMB}MB`;
  }

  return null;
};

const validateEBookFiles = (files) => {
  if (files?.image && files.image[0]) {
    const imageTypeError = validateFileType(files.image[0], ["image"], "Image");
    if (imageTypeError) return imageTypeError;
    const imageSizeError = validateFileSize(files.image[0], 5, "Image");
    if (imageSizeError) return imageSizeError;
  }

  if (files?.background && files.background[0]) {
    const bgTypeError = validateFileType(
      files.background[0],
      ["image"],
      "Background"
    );
    if (bgTypeError) return bgTypeError;
    const bgSizeError = validateFileSize(files.background[0], 5, "Background");
    if (bgSizeError) return bgSizeError;
  }

  if (files?.file && files.file[0]) {
    const fileTypeError = validateFileType(
      files.file[0],
      ["video"],
      "Learning resource"
    );
    if (fileTypeError) return fileTypeError;
    const fileSizeError = validateFileSize(files.file[0], 100, "Learning resource");
    if (fileSizeError) return fileSizeError;
  }

  return null;
};

const validateEBookCategoryFiles = (files) => {
  if (files?.image && files.image[0]) {
    const imageTypeError = validateFileType(files.image[0], ["image"], "Image");
    if (imageTypeError) return imageTypeError;
    const imageSizeError = validateFileSize(files.image[0], 5, "Image");
    if (imageSizeError) return imageSizeError;
  }

  if (files?.icon && files.icon[0]) {
    const iconTypeError = validateFileType(files.icon[0], ["image"], "Icon");
    if (iconTypeError) return iconTypeError;
    const iconSizeError = validateFileSize(files.icon[0], 5, "Icon");
    if (iconSizeError) return iconSizeError;
  }

  return null;
};

const validateReadingCategoryFiles = (files) => {
  if (files?.image && files.image[0]) {
    const imageTypeError = validateFileType(files.image[0], ["image"], "Image");
    if (imageTypeError) return imageTypeError;
    const imageSizeError = validateFileSize(files.image[0], 5, "Image");
    if (imageSizeError) return imageSizeError;
  }
  return null;
};

const validateKidReadingFiles = (files) => {
  if (files?.image && files.image[0]) {
    const imageTypeError = validateFileType(files.image[0], ["image"], "Image");
    if (imageTypeError) return imageTypeError;
    const imageSizeError = validateFileSize(files.image[0], 5, "Image");
    if (imageSizeError) return imageSizeError;
  }

  if (files?.file && files.file[0]) {
    const fileTypeError = validateFileType(
      files.file[0],
      ["video"],
      "Video file"
    );
    if (fileTypeError) return fileTypeError;
    const fileSizeError = validateFileSize(files.file[0], 100, "Video file");
    if (fileSizeError) return fileSizeError;
  }

  return null;
};

module.exports = {
  validateFileType,
  validateFileSize,
  validateEBookFiles,
  validateEBookCategoryFiles,
  validateReadingCategoryFiles,
  validateKidReadingFiles,
};
