var router= require('express').Router();
var crypto=require('crypto');
var checkNotLogin=require('../middleware/checkNotLogin');
var cli=require('redis').createClient({db:1});
var uuid=require('uuid/v4');
var moment=require('moment');
var Ep=require('eventproxy');

module.exports = router;


//注册
router.get('/',checkNotLogin, function (req, res) {
    res.render('reg',{title:'注册',user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});
router.post('/',checkNotLogin, function (req, res,next) {
    var name=req.body.name,password=req.body.password,repeat=req.body.repeat,email=req.body.email,ep=new Ep();
    ep.fail(next);
    ep.on('reg_error',(msg)=>{
        req.flash('error','注册用户失败：'+msg);
        return res.redirect('/reg');
    });

    if(!name.trim() || !password.trim() || !email.trim())return ep.emit('reg_error','注册信息填写不完整！');
    if(password!==repeat)return ep.emit('reg_error','两次输入的密码不一致！');

    cli.hexists('users:'+name,'name',(err,ret)=>{
        if(err)return next(err);
        if(ret)return ep.emit('reg_error','用户名已经注册！');
        cli.hmset('users:'+name,['id',uuid(),'name',name,'password',crypto.createHash('md5').update(password).digest('hex'),'email',email,'face',req.body.face,'regTime',moment().format('YYYY-MM-DD HH:mm:ss')],(err,ret)=>{
            if(err)return next(err);
            req.flash('success','注册成功！');
            res.redirect('/reg');
        });
    });
});


