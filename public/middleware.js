module.exports.isLoggedIn =(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl;
        //store the url they are requesting and redirect after they log back in
        req.flash('error','Sign In is required !');
        return res.redirect('/register');
    }
    next();
}