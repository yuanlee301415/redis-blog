var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var Post = require('../modules/post');
module.exports = router;

//发表
router.get('/',checkLogin, function (req, res) {
  res.render('post',{title:'发表',user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});

router.post('/',checkLogin, function (req, res) {
  var post;
  if(!req.body.title.trim().length || !req.body.post.trim().length){
    req.flash('error','博客填写错误');
    return res.redirect('/post');
  }
  post=new Post({
    title:req.body.title,
    tags:req.body.tag,
    post:req.body.post,
    user:req.session.user
  });
  post.save(function (err) {
    if(err){
      req.flash('error','发表失败');
      return res.redirect('/post');
    };
    req.flash('success','发表成功');
    console.log('/post > post:',post);
    res.redirect('back');
  });
});
