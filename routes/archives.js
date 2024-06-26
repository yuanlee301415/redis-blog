var express = require('express');
var router = express.Router();
var cli=require('redis').createClient({db:3});
var async=require('async');
var _=require('underscore');
var ns=require('../lib/ns');

module.exports = router;

//分类归档
router.get('/', (req, res,next)=>{
    async.waterfall([
        (cb)=>{
            cli.zrevrange(ns('archivesIndex'),0,-1,(err,archives)=>{
                if(err)return cb(err);
                cb(null,archives);
            });
        },
        (archives,cb)=>{
            var archiveGroups=[];
            async.each(archives,(archive,ecb)=>{
                cli.zrevrange(ns('archives',archive),0,-1,(err,ids)=>{
                    if(err)return cb(err);
                    archiveGroups.push({archive:archive,ids:ids});
                    ecb();
                });
            },(err)=>{
                if(err)return cb(err);
                cb(null,archiveGroups);
            });
        },
        (groups,cb)=>{
            async.each(groups,(group,ecb)=>{
                group.more=group.ids.length>10;
                async.map(group.ids.slice(0,10),(id,mcb)=>{
                    cli.hgetall(ns('posts',id),(err,post)=>{
                        if(err)return mcb(err);
                        mcb(null,post);
                    });
                },(err,posts)=>{
                    if(err)return ecb(err);
                    //过滤具体归档日期下的不存在的Post
                    group.posts=posts.filter((post)=>{return post;});
                    ecb();
                });
            },(err)=>{
                if(err)return next(err);
                //过滤没有任何POST的归档日期
                groups=groups.filter((group)=>{
                    return group&&group.posts.length>0;
                });
                cb(null,groups);
            });
        }
    ],(err,groups)=>{
        if(err)return next(err);
        res.render('archives',{
            title:'分类归档',
            user:req.session.user,
            groups:groups,
            success:req.flash('success'),
            error:req.flash('error')
        });
    });
});

router.get('/:archive',(req,res,next)=>{
    var archive=req.params.archive;

    async.waterfall([
        (cb)=>{
            cli.zrevrange(ns('archives',archive),0,-1,(err,ids)=>{
                if(err)return cb(err);
                cb(null,ids);
            });
        },
        (ids,cb)=>{
            async.map(ids,(id,mcb)=>{
               cli.hmget(ns('posts',id),['id','title','userName','time'],(err,post)=>{
                   post=_.object(['id','title','userName','time'],post);
                   mcb(null,post);
               });
            },(err,posts)=>{
                posts=posts.filter((post)=>{return post;});
                cb(null,posts);
            });
        }
    ],(err,posts)=>{
        if(err)return next(err);
        var groups=[{
            archive:archive,
            posts:posts
        }];

        res.render('archives',{
            title:'分类归档',
            user:req.session.user,
            groups:groups,
            success:req.flash('success'),
            error:req.flash('error')
        });

    });

});