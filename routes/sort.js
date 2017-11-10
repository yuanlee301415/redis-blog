var router =require('express').Router();
var cli=require('redis').createClient({db:3});
var async=require('async');
var cli=require('redis').createClient({db:3});

module.exports = router;

router.get('/', function (req, res, next) {
    async.waterfall([
        (cb)=> {
            cli.zrevrange('postIds', 0, -1, (err, ids)=> {
                console.log('postIds:',err,ids);
                if (err)return cb(err);
                cb(null, ids);
            });
        },
        (ids,cb)=>{
            async.map(ids,(id,mcb)=>{
                cli.hgetall('posts:'+id,(err,post)=>{
                    console.log('post:'+id,err,post);
                    if(err)return next(err);
                    mcb(null,post);
                });
            },(err,posts)=>{
                if(err)return next(err);
                cb(null,posts);
            });
        },
        (posts,cb)=>{
            posts.sort((a,b)=>{
                return a.time<b.time?-1:1;
            });
            var i=1;
            posts.forEach((post)=>{
                post.title=post.userName+'-'+(i++);
            });
            cb(null,posts);
        },
        (posts,cb)=>{
            async.map(posts,(post,mcb)=>{
               cli.hset('posts:'+post.id,['title',post.title],(err,ret)=>{
                   if(err)return mcb(err);
                   mcb(null,[post.id,post.title,ret]);
               })
            },(err,ret)=>{
                if(err)return cb(err);
                cb(null,posts);
            });
        }
    ],(err,posts)=>{
        //console.log('result:',err,ret);
        if(err)return next(err);
        res.json(posts);
    });
});

