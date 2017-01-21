////评论博客
var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var cli=require('redis').createClient({db:1});
var Ep=require('eventproxy');
var async=require('async');
var uuid=require('uuid/v4');

module.exports = router;

//保存评论
router.post('/:_id',checkLogin, function (req,res,next) {
    var comment=req.body.comment.trim(),ep=new Ep();
    ep.fail(next);
    ep.on('comment_err',(msg)=>{
        req.flash('error',msg);
        res.redirect('/back');
    });
    if(!comment.length){
        return ep.emit('comment_err','请填写评论内容');
    }
    var cId=uuid(),date=new Date();
    async.parallel({

    },(err,ret)=>{

    })
});