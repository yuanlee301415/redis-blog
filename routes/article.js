var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var config=require('../config');
var cli=require('redis').createClient({db:1});
var Ep=require('eventproxy');
var async=require('async');
var uuid=require('uuid/v4');

module.exports = router;

//博客详细
router.get('/:postId', (req,res,next)=>{
    var key='posts:'+req.params.postId;
    cli.hgetall(key,(err,ret)=>{
        if(err)return next(err);
        if(!ret)return req.flash('error','文章不存在或已经删除！'),res.redirect('/notify');
        //console.log('getPost>ret:',key,ret);
        ret.tags=ret.tags.legnth?ret.tags.split(','):[];
        //console.log('getPost>ret2:',key,ret);

        res.render('article',{
            title:'博客详细页',
            post:ret,
            user:req.session.user,
            op:req.session.user&&req.session.user.id==ret.userId,
            success:req.flash('success').toString(),
            error:req.flash('error').toString(),
            refer:req.originalUrl
        });
        cli.hincrby(key,'pv',1);
    });

});

//保存评论
router.post('/:postId',checkLogin, function (req,res,next) {
    var postId=req.params.postId,content=req.body.content.trim(),ep=new Ep();
    ep.fail(next);
    ep.on('comment_err',(msg)=>{
        req.flash('error',msg);
        res.redirect('back');
    });
    if(!content.length){
        return ep.emit('comment_err','请填写评论内容');
    }

    cli.hget('posts:'+postId,'id',(err,ret)=>{
        if(err)return next(err);
        if(!ret)return ep.emit('comment-err','文章不存在或已经删除');
        //save();
    });

    function save(){
        var cId=uuid(),date=new Date();
        async.parallel({
            commentId:(cb)=>{
                cli.zadd('comments:'+postId)
            }
        },(err,ret)=>{

        });


    }


});