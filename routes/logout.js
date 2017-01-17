var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');

module.exports = router;

//logout
router.get('/',checkLogin, function (req, res) {
  req.session.user=null;
  req.flash('success','退出成功');
  res.redirect('/');
});

