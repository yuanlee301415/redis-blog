var express = require('express');
var router = express.Router();
var Post = require('../modules/post');
var checkLogin =require('../middleware/checkLogin');

module.exports = router;


//标签列表页
router.get('/', function (req, res) {
  Post.getTags(function (err, posts) {
    if(err){
      req.flash('error',err);
      return res.render('error',{message:'查询标签列表失败',error:err});
    }
    res.render('tags',{
      title:'标签',
      posts:posts,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});

//指定标签下的博客
router.get('/:tag', function (req, res) {
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