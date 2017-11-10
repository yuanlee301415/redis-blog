var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var config = require('./config');
var path = require('path');
var fs = require('fs');
var app = express();
var morgan = require('morgan');
var RedisStore = require('connect-redis')(session);
var exHbs=require('express-handlebars').create({
    defaultLayout:'main',
    extname:'.hbs',
    helpers:{
        section: function (name, opts) {
            if(!this._sections)this._sections={};
            this._sections[name]=opts.fn(this);
            return null;
        }
    }
});
app.set('port',3015);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',exHbs.engine);
//app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    store: new RedisStore({}),
    secret: config.secret
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan({stream:fs.createWriteStream('access.log')}));

var errorLog=fs.createWriteStream('error.log');
app.use(function (err,req,res,next) {
  errorLog.write([req.url,'[',new Date(),']',err.stack,'\n'].join('\n'));
  next();
});

app.use('/', require('./routes/index'));//首页
app.use('/reg', require('./routes/reg'));//注册
app.use('/logout', require('./routes/logout'));//登出
app.use('/login', require('./routes/login'));//登录

app.use('/post', require('./routes/post'));//发表文章
app.use('/user', require('./routes/user'));//用户博客列表
app.use('/article', require('./routes/article'));//博客详细+评论博客
app.use('/edit', require('./routes/edit'));//编辑博客
app.use('/remove', require('./routes/remove'));//删除博客

app.use('/archives', require('./routes/archives'));//归档分类
app.use('/tags', require('./routes/tags'));//标签

app.use('/notify', require('./routes/notify'));//通知


// error handlers
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(app.get('port'), function () {
  console.log('---------------------------','Redis Blog port:',app.get('port'),'----',new Date().toLocaleTimeString(),'---------------------------');
});