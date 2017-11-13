var router = require('express').Router();
var cli=require('redis').createClient({db:3});
var Ep=require('eventproxy');
var async=require('async');
var ns=require('../lib/ns');

module.exports = router;

//用户博客列表
router.get('/:name', function (req, res, next) {
    var authorName=req.params.name,ep=new Ep();
    var p=(parseInt(req.query.p,10)||1),limit=5;
    p=p>0?p:1;
    //console.log('username:',name);
    ep.fail(next);
    ep.on('author_error',()=>{
        req.flash('error','用户['+authorName+']不存在！');
        res.redirect('/notify');
    });

    async.waterfall([
        (cb)=>{
            cli.hgetall(ns('users',authorName),(err,author)=>{
                //console.log('author:',author);
                if(err)return cb(err);
                if(!author)return ep.emit('author_error');
                cb(null,author);
            });
        },
        (author,cb)=>{
            async.parallel({
               total:(pcb)=>{
                   cli.zcard(ns('userPosts',author.name),(err,total)=>{
                       //console.log('total:',total);
                       if(err)return pcb(err);
                       pcb(null,total);
                   });
               },
                postIds:(pcb)=>{
                    //console.log('skip:',limit*(p-1),limit*p-1);
                    cli.zrevrange(ns('userPosts',author.name),limit*(p-1),limit*p-1,(err,postIds)=>{
                        //console.log('postIds:',err,postIds);
                        if(err)return cb(err);
                        pcb(null,postIds);
                    });
                }
            },(err,ret)=>{
                if(err)return cb(err);
                ret.author=author;
                //console.log('parallel ret:',ret);
                cb(null,ret);
            });
        },
        (data,cb)=>{
            async.map(data.postIds,(id,cb)=>{
                //console.log('postId:',id);
                cli.hgetall(ns('posts',id),(err,post)=>{
                    if(err)return cb(err);
                    //console.log('post:',post);
                    cb(null,post);
                });
            },(err,posts)=>{
                if(err)return next(err);
                data.posts=posts;
                cb(null,data)
            });
        }
    ],(err,ret)=>{
        if(err)return next(err);

        var pageCnt=Math.ceil(ret.total/limit);
        var page=pageCnt>1?{
            curr:p,
            total:pageCnt,
            pages:(()=>{
                var i=1,pages=[];
                while(i<=pageCnt){
                    pages.push({num:i,isCurr:i==p});
                    i++;
                }
                return pages;
            })(),
            path:'/user/'+ret.author.name+'/?',
            first:'p=1',
            prev:'p='+(p-1),
            next:'p='+(p+1),
            last:'p='+pageCnt,
            isFirstPage:p==1,
            isLastPage:(p-1)*limit+ret.posts.length>=ret.total
        }:false;
        res.render('user',{
            title:'用户详细',
            posts:ret.posts,
            page:page,
            author:ret.author,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });

    });
});