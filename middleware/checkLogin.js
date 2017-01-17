//是否已登录
module.exports=function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录');
        return res.redirect('/login');
    }
    next();
}