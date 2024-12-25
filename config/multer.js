const multer = require('multer');
const uuidv4 = require('uuid').v4; 
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const fileExtension = originalName.split('.').pop();
    const filename = `${Date.now()}-${uuidv4()}.${fileExtension}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

module.exports = upload