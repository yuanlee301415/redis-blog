//是否未登录
module.exports=function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录！');
        return res.redirect('back');
    }
    next();
};