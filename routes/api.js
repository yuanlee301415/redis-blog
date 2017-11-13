var express = require('express');
var router = express.Router();

module.exports = router;

//API
router.post('/post', function (req, res, next) {
    var body=req.body;
    res.json(body);
});