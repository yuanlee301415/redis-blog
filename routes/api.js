var express = require('express');
var router = express.Router();
var crypto = require('crypto');

var User = require('../modules/user');
var Post = require('../modules/post');

module.exports = router;

//API
router.get('/users', function (req, res) {
  User.getAll(function (err, users) {
    if(err || !users)return res.json({error:{code:500,message:'Internet Server error.'}});

    res.json({});
  });
});

router.get('/user/:name', function (req, res) {
  User.get(req.params.name, function (err, user) {
    if(err)return res.json({error:{code:500,message:'Internet Server error.'}});
    if (!user)return res.json({error:{code:404,message:'用户不存在'}});
    res.send(JSON.stringify(new User(user)));
  });
});

router.get('/posts/:name/:page',function(req,res,next){
  var name=req.params.name;
  var p=req.query.page?parseInt(req.query.page):1;
  var limit=5;

  Post.getAll(name,p,limit,function (err, posts,total) {
    if(err){
      return res.json({'error':{code:500,message:'Internet Server error.'}});
    }

    posts.forEach(function(post){
      post.desc=post.post.match(/<p>.+<\/p>/)[0];
    });

    return res.json({
      posts:posts
    });

  });
});

router.put('/api/post', function (req, res, next) {
  res.send({method:req.method,body:req.body});
});