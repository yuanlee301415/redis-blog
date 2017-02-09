//检查限权
module.exports=function checkName(req,res,next){
    if(req.params.name!==req.session.user.name){
        req.flash('error','无限权');
        return res.redirect('/notify');
    }
    next();
};