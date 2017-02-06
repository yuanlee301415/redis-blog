var express = require('express');
var router = express.Router();

module.exports = router;

//通知
router.get('/', (req,res,next)=>{
    var msg=req.flash('error').toString() || req.flash('success').toString();
    if(!msg)return res.redirect('/');
    res.render('notify',{
        title:'通知',
        message:msg,
        back:'/'
    });
});