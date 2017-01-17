var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var Post = require('../modules/post');
var Comment  = require('../modules/comment');

module.exports = router;

//博客详细
router.get('/:name/:_id', function (req,res) {
  Post.getOne(req.params.name,req.params._id, function (err, post) {
    if(err){
      req.flash('error','查询博客失败');
      return res.render('error',{message:'查询博客失败',error:err});
    }
    res.render('article',{
      title:'博客详细页',
      post:post,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString(),
      back:req.url
    });
  });
});

//保存评论
router.post('/:name/:_id',checkLogin, function (req,res) {
  var comment=new Comment(req.params._id,req.session.user,req.body.content);
  //console.log('comment:',comment);
  comment.save(function (err, ret) {
    if(err){
      req.flash('error','评论失败');
    }else{
      req.flash('success','评论成功');
    }
    return res.redirect('back');
  });
});