var express = require('express');
var router = express.Router();


module.exports = router;

//搜索页面
router.get('/', function (req, res) {
  var keyword=req.query.keyword;
  var p=req.query.p?parseInt(req.query.p):1;
  var limit=8;
});