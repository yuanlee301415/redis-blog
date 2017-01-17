var express = require('express');
var router = express.Router();
var path=require('path');
var multer  = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    var extname=path.extname(file.originalname);
    var newname=file.fieldname + '-' + Date.now()+extname;
    req.flash('newname',newname);
    cb(null,newname);
  }
});
var upload = multer({ storage: storage });
var checkLogin =require('../middleware/checkLogin');

module.exports = router;

//上传图片
router.get('/',checkLogin, function (req, res) {
  res.render('upload',{
    title:'文件上传',
    user:req.session.user,
    success:req.flash('success').toString(),
    error:req.flash('error').toString()
  });
});


router.post('/',checkLogin,upload.array('upload',5), function (req, res, next) {
  //console.log(req.flash('newname'));
  res.redirect('/upload');
});
