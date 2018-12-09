const multer = require('multer')
const path = require('path')

const VIDEO_UPLOAD_DIR = './public/video/'

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, VIDEO_UPLOAD_DIR)
  },
  filename: function(req, file, callback) {
    var name = file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    callback(null,name )
  }
})

module.exports = multer({
  storage: storage
}).single('video')
