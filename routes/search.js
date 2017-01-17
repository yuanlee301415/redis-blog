var express = require('express');
var router = express.Router();
var Post = require('../modules/post');

module.exports = router;

//搜索页面
router.get('/', function (req, res) {
  var keyword=req.query.keyword;
  var p=req.query.p?parseInt(req.query.p):1;
  var limit=8;
  Post.search(keyword,p,limit,function (err, posts,total) {
    if(err){
      req.flash('error',err.msg || err.message);
      return res.redirect('back');
    }
    posts.forEach(function(post){
      post.desc=post.post.match(/<p>.+<\/p>/)[0];
    });
    var pageCnt=Math.ceil(total/limit);
    res.render('search',{
      title:'搜索：'+keyword,
      posts:posts,
      page:{
        curr:p,
        total:pageCnt,
        path:'/search/?keyword='+keyword+'&',
        first:'p=1',
        prev:'p='+(p-1),
        next:'p='+(p+1),
        last:'p='+pageCnt,
        isFirstPage:p==1,
        isLastPage:(p-1)*limit+posts.length==total
      },
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});