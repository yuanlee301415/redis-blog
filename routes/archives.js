var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var cli=require('redis').createClient({db:1});
var async=require('async');
var _=require('underscore');

module.exports = router;

//分类归档
router.get('/', (req, res,next)=>{
    async.waterfall([
        (cb)=>{
            cli.zrevrange('archivesIndex',0,-1,(err,archives)=>{
                //console.log('archives:',err,archives);
                if(err)return cb(err);
                cb(null,archives);
            });
        },
        (archives,cb)=>{
            var archiveGroups=[];
            async.each(archives,(archive,ecb)=>{
                cli.zrevrange('archives:'+archive,0,-1,(err,ids)=>{
                    if(err)return cb(err);
                    archiveGroups.push({archive:archive,ids:ids});
                    ecb();
                });
            },(err)=>{
                //console.log('archives:',err,archiveGroups);
                if(err)return cb(err);
                cb(null,archiveGroups);
            });
        },
        (groups,cb)=>{
            async.each(groups,(group,ecb)=>{
                async.map(group.ids,(id,mcb)=>{
                    cli.hgetall('posts:'+id,(err,post)=>{
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
        //console.log('归档：',err,groups);
        if(err)return next(err);
        res.render('archives',{
            title:'分类归档',
            user:req.session.user,
            groups:groups,
            success:req.flash('success'),
            error:req.flash('error')
        });
    });

  return;
  Post.getArchive(function(err,list){
    if(err){
      console.log('archive:',err);
      return res.redirect('/');
    }
    res.render('archive',{
      title:'分类归档',
      user:req.session.user,
      list:list,
      success:req.flash('success'),
      error:req.flash('error')
    });
  });
});