var express = require('express');
var router = express.Router();
var cli=require('redis').createClient({db:1});
var async=require('async');
var Ep=require('eventproxy');

module.exports = router;

//删除博客
router.get('/:postId', (req,res,next)=>{
    var postId=req.params.postId;
    console.log('postId:',postId);

    var ep=new Ep();
    ep.fail(next);
    ep.on('send',(msg)=>{
        var type=msg.error?'error':'' || 'success';
        req.flash(type,msg[type]);
        res.redirect('/notify');
    });

    async.waterfall([
        //删除POST列表中的post id
        (cb)=>{
           cli.zrem('postIds',postId,(err,ret)=>{
               console.log('删除POST列表中的post id:',postId,err,ret);
               if(err)return cb(err);
               if(!ret)return ep.emit('send',{error:'文章不存在或已经删除'});
               cb();
           });
        },
        (cb)=>{
            //删除POST
            cli.del('posts:'+postId,(err,ret)=>{
                console.log('删除POST:',err,ret);
                if(err)return cb(err);
                if(!ret)return ep.emit('send',{error:'删除文章失败！'});
                cb();
            });
        },
        (cb)=>{
            //获取评论ID列表
            cli.zrange('postCommentIds:'+postId,[0,-1],(err,commentIds)=>{
                console.log('获取评论ID列表:',err,commentIds);
                if(err)return cb(err);
                cb(null,commentIds);
            });
        },
        (commentIds,cb)=>{
            //删除评论
            if(!commentIds || !commentIds.length)return cb(null,false);
            async.each(commentIds,(id,ecb)=>{
                cli.del('comments:'+id,(err,ret)=>{
                    console.log('删除评论:comments'+id,err,ret);
                    if(err)return ecb(err);
                    ecb();
                });
            },(err)=>{
                if(err)return cb(err);
                cb(null,true);
            });
        },
        (hasList,cb)=>{
            //删除评论ID列表
            if(!hasList)return cb();
            cli.del('postCommentIds:'+postId,(err,ret)=>{
                console.log('删除评论ID列表:postCommentIds'+postId,err,ret);
                if(err)return cb(err);
                cb();
            });
        }

    ],(err)=>{
        if(err)return next(err);
        ep.emit('send',{success:'删除文章成功'});
    });

});