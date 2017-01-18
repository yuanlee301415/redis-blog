var router= require('express').Router();
var crypto=require('crypto');
var checkNotLogin=require('../middleware/checkNotLogin');
var cli=require('redis').createClient({db:1});
var uuid=require('uuid/v4');
var moment=require('moment');

module.exports = router;


//注册
router.get('/',checkNotLogin, function (req, res) {
    res.render('reg',{title:'注册',user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});
router.post('/',checkNotLogin, function (req, res,next) {
    var name=req.body.name,password=req.body.password,repeat=req.body.repeat;
    if(password!==repeat){
        req.flash('error','两次输入的密码不一致！');
        return res.redirect('/reg');
    }

    cli.hexists('users:'+name,'name',(err,ret)=>{
        if(err){
            req.flash('error','用户名检测失败！');
            return res.redirect('/reg');
        }
        if(ret){
            req.flash('error','用户名已经注册！');
            return res.redirect('/reg');
        }
        cli.hmset('users:'+name,['id',uuid(),'name',name,'password',crypto.createHash('md5').update(password).digest('hex'),'email',req.body.email,'face',req.body.face,'regTime',moment().format('YYYY-MM-DD HH:mm:ss')],(err,ret)=>{
           if(err)return next(err);
            req.flash('success','注册成功！');
            res.redirect('/reg');
        });
    });
});


