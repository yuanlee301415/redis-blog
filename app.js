var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var ConnectMongo = require('connect-mongo')(session);
var flash = require('connect-flash');
var routes = require('./routes/index');
var config = require('./config');
var path = require('path');
var fs = require('fs');
var app = express();
var port=3003;
var colors=require('colors');
var morgan = require('morgan');
var redis=require('redis');
var rClient=redis.createClient();
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

colors.setTheme({
  info: 'green',
  data: 'blue',
  warn: 'yellow',
  debug: 'magenta',
  error: 'red'
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',exHbs.engine);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: config.secret,
    key: config.db,
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
    store: new ConnectMongo({
        url: 'mongodb://localhost/RedisBlog'
    })
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan({stream:fs.createWriteStream('access.log')}));;

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
app.use('/upload', require('./routes/upload'));//上传图片
app.use('/user', require('./routes/user'));//用户博客列表
app.use('/article', require('./routes/article'));//博客详细
app.use('/edit', require('./routes/edit'));//编辑博客
app.use('/remove', require('./routes/remove'));//删除博客

app.use('/archive', require('./routes/archive'));//归档分类
app.use('/tags', require('./routes/tags'));//标签
app.use('/search', require('./routes/search'));//搜索
app.use('/links', require('./routes/links'));//友情链接
app.use('/reprint', require('./routes/reprint'));//转载

app.use('/api', require('./routes/api'));//api
app.use('/api', function (req, res, next) {
  res.send({error:{code:404,message:'API Not Found'}});
});

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

app.listen(port, function () {
  console.log('---------------------------','Redis Blog port:',port,'----',new Date().toLocaleTimeString(),'---------------------------');
});