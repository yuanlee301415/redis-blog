var express = require('express');
var router = express.Router();
var checkName =require('../middleware/checkName');
var cli=require('redis').createClient({db:1});
var postTags=require('../config').postTags;

module.exports = router;

//编辑博客
router.get('/:postId', function (req, res) {
  var postId=req.params.postId;
  cli.hgetall('posts:'+postId,(err,post)=>{
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

    console.log('post:',post);

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
router.post('/:postId', function (req, res) {
  var postId=req.params.postId,body=req.body;

  cli.hgetall('posts:'+postId,(err,post)=>{
    if(err)return next(err);
    if(!post)return req.flash('error','文章不存在或已经删除！'),res.redirect('/notify');

    if(req.session.user && req.session.user.name !== post.userName )return req.flash('error','无权限'),res.redirect('/notify');

    var tags=[];
    postTags.forEach((tag)=>{
      if(body['tag-'+tag]){
        tags.push(tag);
      }
    });

    cli.hmset('posts:'+postId,['title',body.title,'content',body.content,'tags',tags.join(',')],(err)=>{
      if(err)return next(err);
      res.redirect('/article/'+postId);
    });

  });


  return;
  Post.update(req.body._id,req.body.post,function (err, ret) {
    if(err){
      console.log('/edit>err:',err);
      req.flash('error','编辑失败');
      return res.redirect('back');
    }
    req.flash('success','编辑成功');
    res.redirect('/article/'+req.session.user.name+'/'+req.body._id);
  });
});