const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const reportUploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "reports"
);

const resolutionUploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "resolutions"
);

const progressUploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "progress"
);

const adminEvidenceUploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "admin-resolution"
);

for (const directory of [reportUploadDirectory, resolutionUploadDirectory, progressUploadDirectory, adminEvidenceUploadDirectory]) {
  fs.mkdirSync(directory, { recursive: true });
}

const allowedExtensions = [
  ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
  ".mp4", ".mov", ".webm", ".m4v"
];

const allowedMimeTypes = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif",
  "video/mp4", "video/quicktime", "video/webm", "video/x-m4v"
];

function extensionFor(file) {
  let extension = path.extname(file.originalname).toLowerCase();
  if (extension) return extension;

  const byMime = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
    "video/x-m4v": ".m4v",
  };

  return byMime[file.mimetype] || "";
}

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtension = allowedExtensions.includes(extension);
  const validMimeType = allowedMimeTypes.includes(file.mimetype);
  const genericMime = file.mimetype === "application/octet-stream" && validExtension;

  if (!validMimeType && !genericMime) {
    return cb(new Error(`Unsupported media format: ${file.mimetype}`));
  }

  cb(null, true);
}

function createStorage(directory) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, directory),
    filename: (req, file, cb) => {
      cb(
        null,
        `${Date.now()}-${crypto.randomUUID()}${extensionFor(file)}`
      );
    },
  });
}

const uploadReportEvidence = multer({
  storage: createStorage(reportUploadDirectory),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});

const uploadResolutionEvidence = multer({
  storage: createStorage(resolutionUploadDirectory),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});

const uploadProgressEvidence = multer({
  storage: createStorage(progressUploadDirectory),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});

const uploadAdminResolutionEvidence = multer({
  storage: createStorage(adminEvidenceUploadDirectory),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});

// Backward-compatible alias for the existing mobile client.
const uploadReportImage = uploadReportEvidence;

module.exports = {
  uploadReportImage,
  uploadReportEvidence,
  uploadResolutionEvidence,
  uploadProgressEvidence,
  uploadAdminResolutionEvidence,
};
