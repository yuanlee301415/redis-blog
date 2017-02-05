var express = require('express');
var router = express.Router();
var checkLogin =require('../middleware/checkLogin');
var cli=require('redis').createClient({db:1});
//var Ep=require('eventproxy');
var async=require('async');
var _=require('underscore');


module.exports = router;

//分类归档
router.get('/', (req, res)=>{
    async.waterfall([
        (cb)=>{
            cli.zrevrange('archivesIndex',0,-1,(err,archives)=>{
                console.log('archives:',err,archives);
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
                console.log('archives:',err,archiveGroups);
                if(err)return cb(err);
                cb(null,archiveGroups);
            });
        },
        (groups,cb)=>{
            async.each(groups,(group,ecb)=>{
                //group.posts=[];
                async.map(group.ids,(id,mcb)=>{
                    cli.hgetall('posts:'+id,(err,post)=>{
                        if(err)return mcb(err);
                    });
                },(err,posts)=>{
                    if(err)return ecb(err);
                });
            });
        }
    ],(err,posts)=>{
        console.log('post:',err,posts);
        if(err)return next(err);

    });
  return;
  Post.getArchive(function(err,list){
    if(err){
      console.log('archive:'.error,err);
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
