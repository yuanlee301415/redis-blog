var router =require('express').Router();
var User=require('../modules/user');
var Post=require('../modules/post');
module.exports = router;

router.get('/', function (req, res, next) {
    var p=req.query.p?parseInt(req.query.p):1;
    var limit=10;
    Post.getAll(null,p,limit,function (err, posts,total) {
        if(err)posts=[];
        posts.forEach(function(post){
            post.desc=post.post.match(/<p>.+<\/p>/)[0];
        });
        var pageCnt=Math.ceil(total/limit);
        res.render('index',{
            title:'主页',
            posts:posts,
            page:{
                curr:p,
                total:pageCnt,
                path:'/?',
                first:'p=1',
                prev:'p='+(p-1),
                next:'p='+(p+1),
                last:'p='+pageCnt,
                isFirstPage:p==1,
                isLastPage:(p-1)*limit+posts.length>=total
            },
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
});

