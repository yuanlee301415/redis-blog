var express = require('express');
var async = require('async');
var router = express.Router();
var cli=require('redis').createClient({db:1});
var checkLogin =require('../middleware/checkLogin');
var postTags =require('../config.js').postTags;

module.exports = router;


//标签列表页
router.get('/', (req, res)=>{
    res.render('tags',{
        title:'Tags',
        tags:postTags
    });
});

//指定标签下的博客
router.get('/:tag', (req, res,next)=>{
    var currTag=req.params.tag;
    async.waterfall([
        (cb)=>{
            cli.zrevrange('tags:'+currTag,0,-1,(err,postIds)=>{
                if(err)return cb(err);
                console.log('postIds:',req.params.tag,postIds);
                cb(null,postIds);
            });
        },
        (postIds,cb)=>{
            async.map(postIds,(id,mcb)=>{
                cli.hgetall('posts:'+id,(err,post)=>{
                    if(err)return mcb(err);
                    mcb(null,post);
                });
            },(err,posts)=>{
                if(err)return cb(err);
                posts.forEach((post)=>{
                    post.tags=post.tags.split('-').map((tag)=>{
                        var curr='';
                        if(currTag==tag){
                            curr='curr';
                        }
                        return {
                            name:tag,
                            curr:curr
                        }
                    });
                });
                cb(null,posts);
            });
        }
    ],(err,posts)=>{
        console.log('posts:',err,posts);
        if(err)return next(err);
        res.render('tag',{
            title:'Tag:'+req.params.tag,
            user:req.session.user,
            posts:posts,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });

    return;
  var p=req.query.p?parseInt(req.query.p):1;
  var limit=2;
  Post.getTag(req.params.tag,p,limit,function(err,posts,total){
    if(err){
      req.flash('error','查询此标签下的博客失败');
      return res.render('error',{
        message:'查询此标签下的博客失败',
        error:err
      });
    }
    posts.forEach(function(post){
      var desc=post.post.match(/<p>.+<\/p>/);
      desc=desc?desc[0]:post.post;
      post.desc=desc;
    });
    var pageCnt=Math.ceil(total/limit);
    res.render('tag',{
      title:'TAG:'+req.params.tag,
      user:req.session.user,
      posts:posts,
      page:{
        curr:p,
        total:pageCnt,
        path:'/tag/'+req.params.tag+'?',
        first:'p=1',
        prev:'p='+(p-1),
        next:'p='+(p+1),
        last:'p='+pageCnt,
        isFirstPage:p==1,
        isLastPage:(p-1)*limit+posts.length==total
      },
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});