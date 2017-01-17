var express = require('express');
var router = express.Router();
var Post = require('../modules/post');

module.exports = router;

//友情链接links
router.get('/', function (req, res) {
  res.render('links',{
    title:'友情链接',
    user:req.session.user,
    success:req.flash('success').toString(),
    error:req.flash('error').toString()
  });
});