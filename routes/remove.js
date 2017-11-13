var express = require('express');
var router = express.Router();
var cli=require('redis').createClient({db:3});
var async=require('async');
var moment=require('moment');
var Ep=require('eventproxy');
var ns=require('../lib/ns');

module.exports = router;

//删除博客
router.get('/:postId', (req,res,next)=>{
    var postId=req.params.postId;
    console.log('====remove:');

    var ep=new Ep();
    ep.fail(next);
    ep.on('send',(msg)=>{
        var type=msg.error?'error':'' || 'success';
        req.flash(type,msg[type]);
        res.redirect('/notify');
    });

    async.waterfall([
        (cb)=>{
            //获取文章
            cli.hgetall(ns('posts',postId),(err,post)=>{
                console.log('post:',err,post);
                if(err)return next(err);
                if(!post)return ep.emit('send',{error:'文章不存在或已经删除'});
                cb(null,post);
            });
        },
        (post,cb)=>{
            //删除POST列表中的post id
            cli.zrem(ns('postIds'),postId,(err,ret)=>{
                console.log('\n删除POST列表中的postId:',postId,err,ret);
                if(err)return cb(err);
                cb(null,post);
            });
        },
        (post,cb)=>{
            async.parallel({
                delPost:(pcb)=>{
                    //删除POST
                    cli.del(ns('posts',postId),(err,ret)=>{
                        console.log('\n删除POST:',err,ret);
                        if(err)return pcb(err);
                        pcb(null,ret);
                    });
                },
                cutPostCount:(pcb)=>{
                    cli.decr(ns('posts','count'),(err,ret)=>{
                        console.log('\npost count -1:',err,ret);
                        if(err)return pcb(err);
                        pcb(null,ret);
                    });
                },
                delTag:(pcb)=>{
                    var tags=post.tags.length?post.tags.split(','):[];
                    async.map(tags,(tag,mcb)=>{
                        cli.zrem(ns('tags',tag),postId,(err,ret)=>{
                            if(err)return mcb(err);
                            mcb(null,[tag,ret]);
                        });
                    },(err,ret)=>{
                        console.log('\n删除tags:',err,ret);
                        if(err)return pcb(err);
                        pcb(null,ret);
                    });
                },
                delArchives:(pcb)=>{
                    var archive=moment(post.time).format('YYYY-MM');
                    cli.zrem(ns('archives',archive),postId,(err,ret)=>{
                        console.log('\n删除归档:',err,archive,ret);
                        if(err)return pcb(err);
                        pcb(null,[archive,postId,ret]);
                    });
                },
                delUserPosts:(pcb)=>{
                    cli.zrem(ns('userPosts',post.userName),postId,(err,ret)=>{
                        console.log('\n删除用户的文章ID:',err,ret);
                        if(err)return pcb(err);
                        pcb(null,ret);
                    });
                },
                delComments:(pcb)=>{
                    async.waterfall([
                        (cpcb)=>{
                            //获取评论ID列表
                            cli.zrange(ns('postCommentIds',postId),[0,-1],(err,commentIds)=>{
                                console.log('获取评论ID列表:',err,commentIds);
                                if(err)return cpcb(err);
                                cpcb(null,commentIds);
                            });
                        },
                        (commentIds,cpcb)=>{
                            //删除评论
                            if(!commentIds || !commentIds.length)return cpcb(null,false);
                            async.each(commentIds,(id,ecb)=>{
                                cli.del(ns('comments',id),(err,ret)=>{
                                    console.log('删除评论:comments'+id,err,ret);
                                    if(err)return ecb(err);
                                    ecb();
                                });
                            },(err)=>{
                                if(err)return cpcb(err);
                                cpcb(null,true);
                            });
                        },
                        (hasList,cpcb)=>{
                            //删除评论ID列表
                            if(!hasList)return cpcb();
                            cli.del(ns('postCommentIds',postId),(err,ret)=>{
                                console.log('删除评论ID列表:postCommentIds'+postId,err,ret);
                                if(err)return cpcb(err);
                                cpcb(null,'删除评论成功');
                            });
                        }
                    ],(err,ret)=>{
                       if(err)return cpcb(err);
                        pcb(null,ret);
                    });
                }
            },(err,ret)=>{
                console.log('del post last ret:',err,ret);
                if(err)return cb(err);
                cb();
            });
        }
    ],(err)=>{
        if(err)return next(err);
        ep.emit('send',{success:'删除文章成功'});
    });

});