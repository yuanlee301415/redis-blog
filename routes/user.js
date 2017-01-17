var router = require('express').Router();
var User = require('../modules/user');
var Post = require('../modules/post');

module.exports = router;

//用户博客列表
router.get('/:name', function (req, res, next) {
    User.get(req.params.name, function (err, user) {
        if(!user)return res.render('error',{message:'用户不存在',error:null});
        var p=req.query.p?parseInt(req.query.p):1;
        var limit=5;
        Post.getAll(user.name,p,limit,function (err, posts,total) {
            if(err){
                req.flash('error',err);
                return res.render('error',{message:'查询博客列表错误',error:err});
            }
            posts.forEach(function(post){
                post.desc=post.post.match(/<p>.+<\/p>/)[0];
            });
            var pageCnt=Math.ceil(total/limit);
            res.render('user',{
                title:'用户页面',
                postUser:user,
                posts:posts,
                page:{
                    curr:p,
                    total:pageCnt,
                    path:'/user/'+user.name+'/?',
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
});