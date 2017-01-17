var router= require('express').Router();
var User=require('../modules/user');
var checkNotLogin=require('../middleware/checkNotLogin');

module.exports = router;


//注册
router.get('/',checkNotLogin, function (req, res) {
    res.render('reg',{title:'注册',user:req.session.user,success:req.flash('success').toString(),error:req.flash('error').toString()});
});
router.post('/',checkNotLogin, function (req, res) {
    var name=req.body.name,password=req.body.password,repeat=req.body.repeat;
    if(password!==repeat){
        req.flash('error','两次输入的密码不一致！');
        return res.redirect('/reg');
    }

    var newUser=new User({
        name:name,
        password:password,
        email:req.body.email,
        face:req.body.face
    });

    User.get(name, function (err, ret) {
        if(err){
            console.log('同名检测失败：'.error,err);
            req.flash('error',err);
            return res.redirect('/');
        }
        if(ret){
            req.flash('error','用户名已注册！');
            return res.redirect('/reg');
        }
        newUser.save(function (err) {
            if(err){
                console.log('新用户保存失败：'.error,err);
                req.flash('error','新用户保存失败');
                return res.redirect('/reg');
            }
            req.session.user=null;
            req.flash('success','注册成功');
            res.redirect('/login');
        });
    });
});


