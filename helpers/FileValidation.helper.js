/**
 * File validation helper for uploads
 */

const validateFileType = (file, allowedTypes, fieldName) => {
  if (!file) return null;

  // Predefined groups of mime types
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

  // Friendly names to show to users
  const friendlyNames = {
    image: ["JPEG", "JPG", "PNG", "GIF", "WebP"],
    video: ["MP4", "AVI", "MOV", "WMV", "FLV", "WEBM", "MKV", "QuickTime"]
  };

  // Build valid mime list from allowedTypes which may include group keys (e.g. 'image')
  const validTypes = allowedTypes.flatMap((type) => {
    // normalize type to lower for group match
    const t = String(type).toLowerCase();
    if (allowedMimeTypes[t]) return allowedMimeTypes[t];
    // if not a group, treat type as an extension name (e.g. 'JPG' or 'png')
    // try to map common extensions to mime types
    const ext = String(type).toLowerCase();
    switch (ext) {
      case 'jpg':
        return ['image/jpg'];
      case 'jpeg':
        return ['image/jpg'];
      case 'png':
        return ['image/png'];
      case 'gif':
        return ['image/gif'];
      case 'webp':
        return ['image/webp'];
      case 'mp4':
        return ['video/mp4'];
      case 'avi':
        return ['video/avi'];
      case 'mov':
        return ['video/mov', 'video/quicktime'];
      case 'wmv':
        return ['video/wmv'];
      case 'flv':
        return ['video/flv'];
      case 'webm':
        return ['video/webm'];
      case 'mkv':
        return ['video/mkv'];
      default:
        return [];
    }
  });

  if (!validTypes.includes(file.mimetype)) {
    // Build a friendly list to show the user
    const friendlyList = allowedTypes.flatMap((type) => {
      const t = String(type).toLowerCase();
      if (friendlyNames[t]) return friendlyNames[t];
      // If the caller passed explicit extensions, normalize and show them as-is
      return [String(type).toUpperCase()];
    });

    // Deduplicate
    const uniqueFriendly = [...new Set(friendlyList)];
    return `${fieldName} must be one of the following types: ${uniqueFriendly.join(', ')}`;
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

const validateImageFile = (files) => {
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
  validateImageFile,
  validateKidReadingFiles,
};
