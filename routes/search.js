var express = require('express');
var router = express.Router();


module.exports = router;

//搜索页面
router.get('/', function (req, res) {
    var keyword=req.query.keyword;
    var p=parseInt(req.query.p,10):1,limit=8;
    p=p>0?p:1;
});