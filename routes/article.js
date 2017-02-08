var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var config=require('../config');
var cli=require('redis').createClient({db:1});
var Ep=require('eventproxy');
var async=require('async');
var moment=require('moment');
var uuid=require('uuid/v4');

module.exports = router;

//博客详细
router.get('/:postId', (req,res,next)=>{
    var key='posts:'+req.params.postId;

    async.waterfall([
        (cb)=>{
            cli.hgetall(key,(err,ret)=>{
                if(err)return next(err);
                if(!ret)return req.flash('error','文章不存在或已经删除！'),res.redirect('/notify');
                ret.tags=ret.tags.legnth?ret.tags.split(','):[];
                cb(null,ret);
            });
        },
        (post,cb)=>{
           cli.zrange('commentIds:'+post.id,0,-1,(err,commentIds)=>{
               if(err)return cb(err);
               console.log('commentIds:',commentIds);
               cb(null,post,commentIds);
           });
        },
        (post,commentIds,cb)=>{
            async.map(commentIds,(id,mcb)=>{
                cli.hmget('comments:'+id,(err,comment)=>{
                    mcb(null,comment);
                });
            },(err,comments)=>{
                
            });
        }
    ],(err)=>{
        if(err)return next(err);
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
    var postId=req.params.postId,content=req.body.content.trim(),ep=new Ep(),user=req.session.user;
    ep.fail(next);
    ep.on('comment_err',(msg)=>{
        req.flash('error',msg);
        res.redirect('back');
    });
    ep.on('send',(msg)=>{
        req.flash('success',msg);
        res.redirect('back');
    });
    if(!content.length){
        return ep.emit('comment_err','请填写评论内容');
    }

    cli.hget('posts:'+postId,'id',(err,ret)=>{
        if(err)return next(err);
        if(!ret)return ep.emit('comment_err','文章不存在或已经删除');
        //save
        var id=uuid(),date=new Date(),time=moment(date).format('YYYY-MM-DD HH:mm:ss');
        async.parallel([
            (cb)=>{//评论数据
                cli.hmset('comments:'+id,['comment',content,'userName',user.name,'userId',user.id,'time',time],(err)=>{
                    if(err)return cb(err);
                    cb();
                });
            },
            (cb)=>{//以时间降序保存评论ID
                cli.zadd('commentsIds:'+postId,[+date,id],(err)=>{
                    if(err)return cb(err);
                    cb();
                });
            }
        ],(err)=>{
            if(err)return next(err);
            ep.emit('send','文章评论成功！');
        });
    });
});