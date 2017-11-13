var express = require('express');
var router = express.Router();
var ns=require('../lib/ns');
var cli=require('redis').createClient({db:3});
var postTags=require('../config').postTags;

module.exports = router;

//编辑博客
router.get('/:postId',function (req, res) {
  var postId=req.params.postId;

  cli.hgetall(ns('posts',postId),(err,post)=>{
    if(err)return next(err);
    if(!post)return req.flash('error','文章不存在或已经删除！'),res.redirect('/notify');

    if(req.session.user && req.session.user.name !== post.userName )return req.flash('error','无权限'),res.redirect('/notify');

    post.tags=(post.tags.length?post.tags.split(','):[]);
    post.tags=postTags.map((tag)=>{
      return {
        name:tag,
        checked:!!~post.tags.indexOf(tag)
      }
    });

    res.render('edit',{
      title:'编辑',
      user:req.session.user,
      post:post,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });

  });

});

//更新博客
router.post('/:postId', function (req, res,next) {
  var postId=req.params.postId,body=req.body;

  cli.hgetall(ns('posts',postId),(err,post)=>{
    if(err)return next(err);
    if(!post)return req.flash('error','文章不存在或已经删除！'),res.redirect('/notify');

    if(req.session.user && req.session.user.name !== post.userName )return req.flash('error','无权限'),res.redirect('/notify');

    var tags=[];
    postTags.forEach((tag)=>{
      if(body['tag-'+tag]){
        tags.push(tag);
      }
    });

    cli.hmset(ns('posts',postId),['title',body.title,'content',body.content,'tags',tags.join(',')],(err)=>{
      if(err)return next(err);
      req.flash('success','编辑成功');
      res.redirect('/article/'+postId);
    });

  });

});