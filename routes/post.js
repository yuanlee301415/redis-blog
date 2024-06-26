var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var ns=require('../lib/ns');
var postTags=require('../config.js').postTags;
var Ep=require('eventproxy');
var cli=require('redis').createClient({db:3});
var uuid=require('uuid/v4');
var async=require('async');
var moment=require('moment');

module.exports = router;

//发表
router.get('/',checkLogin, function (req, res) {
  res.render('post',{title:'发表',postTags:postTags,user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});

router.post('/',checkLogin, function (req, res,next) {
    var ep=new Ep(),user=req.session.user,title=req.body.title.trim(),content=req.body.content.trim();
    ep.fail(next);
    ep.on('post_err',(msg)=>{
        req.flash('error','Save post error:'+msg);
        return res.redirect('/post');
    });
    ep.after('postIds','userPosts','posts','tags','archivesIndex','archives','postCommentsCount','postCount',()=>{
        req.flash('success','文章发表成功！');
        res.redirect('/post');
    });

    if(!title.length || !content.length)return ep.emit('post_err','标题或正文内容未填写');
    if(!postTags.length)return ep.emit('post_err','至少选择一个标签');

    //save
    var postId=uuid(),date=new Date(),ym=moment(date).format('YYYY-MM');
    async.parallel({
        postIds:(cb)=>{
            cli.zadd(ns('postIds'),[+date,postId],(err,ret)=>{
                if(err)return cb(err);
                console.log('postIds>ret:',ret);
                cb(null,ret);
            });
        },
        userPosts:(cb)=>{
            cli.zadd(ns('userPosts',user.name),[+date,postId],(err,ret)=>{
                if(err)return cb(err);
                cb(null,ret);
            });
        },
        posts:(cb)=>{
            var tags=[];
            postTags.forEach((tag)=>{
                if(req.body['tag-'+tag]){
                    tags.push(tag);
                }
            });
            cli.hmset(ns('posts',postId),[
                    'id',postId,
                    'title',title,
                    'content',content,
                    'time',moment(date).format('YYYY-MM-DD HH:mm:ss'),
                    'tags',tags.join(','),
                    'pv',0,
                    'commentCnt',0,
                    'reprintCnt',0,
                    'userId',user.id,
                    'userName',user.name
            ],(err,ret)=>{
                if(err)return cb(err);
                cb(null,ret);
            });
        },
        tags:(cb)=>{
            var tags=[];
            postTags.forEach((tag)=>{
                if(req.body['tag-'+tag]){
                    tags.push(tag);
                }
            });

            async.each(tags,(tag,ecb)=>{
                cli.zadd(ns('tags',tag),[+date,postId],(err,ret)=>{
                    if(err)return ecb(err);
                    ecb(null,ret);
                });
            },(err,ret)=>{
                if(err)return cb(err);
                cb(null,ret);
            });
        },
        archivesIndex:(cb)=>{
            var score=+new Date(date.getFullYear(),date.getMonth());//以当前时间的年月1日0点时间戳为score
            cli.zadd(ns('archivesIndex'),[score,ym],(err,ret)=>{
                if(err)return cb(err);
                cb(null,ret);
            });
        },
        archives:(cb)=>{
            cli.zadd(ns('archives',ym),[+date,postId],(err,ret)=>{
                if(err)return cb(err);
                cb(null,ret);
            });
        }
    },(err)=>{
        if(err)return console.log(err),ep.emit('post_err','保存POST错误');
        cli.incr(ns('posts','count'),(err,ret)=>{
            if(err)return console.log(err),ep.emit('post_err','保存POST错误');
            req.flash('success','文章发表成功！');
            res.redirect('/post');
        });
    });
});
