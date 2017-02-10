var router =require('express').Router();
var cli=require('redis').createClient({db:1});
var async=require('async');
var Ep=require('eventproxy');

module.exports = router;

router.get('/', function (req, res, next) {
    async.waterfall([
        (cb)=> {
            cli.zrevrange('postIds', 0, -1, (err, ids)=> {
                //console.log('postIds:',err,ids);
                if (err)return cb(err);
                cb(null, ids);
            });
        },
        (ids,cb)=>{
            async.map(ids,(id,ecb)=>{
                cli.hgetall('posts:'+id,(err,post)=>{
                    console.log('posts:'+id,err,id);
                    console.log(post.id);
                    if(err)return next(err);
                    ecb(null,post);
                });
            },(err,ret)=>{
                if(err)return next(err);
                ret.forEach((post)=>{
                    //console.log('post:',post);
                    post.tags=post.tags.length?post.tags.split(',').map((tag)=>{
                        return {
                            name:tag,
                            curr:false
                        }
                    }):[];
                    console.log('post.tags:',post.tags);
                });
                cb(null,ret);
            });
        }
    ],(err,ret)=>{
        //console.log('result:',err,ret);
        if(err)return next(err);
        res.render('index',{
            title:'Home',
            posts:ret,
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });

    return;
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

