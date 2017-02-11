var express = require('express');
var async = require('async');
var router = express.Router();
var cli=require('redis').createClient({db:1});
var checkLogin =require('../middleware/checkLogin');
var postTags =require('../config.js').postTags;

module.exports = router;


//标签列表页
router.get('/', (req, res)=>{
    res.render('tags',{
        title:'Tags',
        tags:postTags
    });
});

//指定标签下的博客
router.get('/:tag', (req, res,next)=>{
    var currTag=req.params.tag,p=parseInt(req.query.p) || 1,limit=5;

    async.waterfall([
        (cb)=>{
            async.parallel({
                total:(pcb)=>{
                    cli.zcard('tags:'+currTag,(err,total)=>{
                        if(err)return pcb(err);
                        pcb(null,total);
                    })
                },
                postIds:(pcb)=>{
                    cli.zrevrange('tags:'+currTag,limit*(p-1),limit*p-1,(err,postIds)=>{
                        if(err)return pcb(err);
                        //console.log('postIds:',req.params.tag,postIds);
                        pcb(null,postIds);
                    });
                }
            },(err,data)=>{
                if(err)return cb(err);
                cb(null,data);
            });
        },
        (data,cb)=>{
            async.map(data.postIds,(id,mcb)=>{
                cli.hgetall('posts:'+id,(err,post)=>{
                    if(err)return mcb(err);
                    mcb(null,post);
                });
            },(err,posts)=>{
                if(err)return cb(err);
                posts.forEach((post)=>{
                    post.tags=post.tags.split(',').map((tag)=>{
                        var curr='';
                        if(currTag==tag){
                            curr='curr';
                        }
                        return {
                            name:tag,
                            curr:curr
                        }
                    });
                });
                data.posts=posts;
                cb(null,data);
            });
        }
    ],(err,data)=>{
        //console.log('posts:',err,posts);
        if(err)return next(err);
        var pageCnt=Math.ceil(data.total/limit);

        res.render('tag',{
            title:'Tag:'+req.params.tag,
            user:req.session.user,
            posts:data.posts,
            page:{
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
                path:'/tags/'+currTag+'?',
                first:'p=1',
                prev:'p='+(p-1),
                next:'p='+(p+1),
                last:'p='+pageCnt,
                isFirstPage:p==1,
                isLastPage:(p-1)*limit+data.posts.length==data.total
            },
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });

});