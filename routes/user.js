var router = require('express').Router();
var cli=require('redis').createClient({db:1});
var Ep=require('eventproxy');
var async=require('async');

module.exports = router;

//用户博客列表
router.get('/:name', function (req, res, next) {
    var name=req.params.name,ep=new Ep();
    console.log('username:',name);
    ep.fail(next);
    ep.on('user_error',()=>{
        req.flash('error','用户['+name+']不存在！');
        res.redirect('/notify');
    });

    ep.on('send',(data)=>{
        console.log('send data:',data);

    });

    async.waterfall([
        (cb)=>{
            cli.hgetall('users:'+name,(err,user)=>{
                console.log('user:',user);
                if(err)return cb(err);
                if(!user)return ep.emit('user_error');
                cb(null,user);
            });
        },
        (user,cb)=>{
            cli.zrange('userPosts:'+name,0,-1,(err,postIds)=>{
                if(err)return cb(err);
                console.log('userPosts:',postIds);
                cb(null,{user:user,postIds:postIds});
            });
        }
    ],(err,ret)=>{
        if(err)return next(err);

        async.map(ret.postIds,(id,cb)=>{
            
            cli.hgetall('post:'+id,(err,post)=>{
                if(err)return cb(err);
                cb(null,post);
            });
        },(err,posts)=>{
            if(err)return next(err);
            ep.emit('send',{user:ret.user,posts:posts});
        });
    });


    return;
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