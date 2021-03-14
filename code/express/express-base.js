import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import * as config from "../base/config.js";

const redisStore = connectRedis(session);

export const app = express();
export const core = express.Router();

let autoLogin = null;
let logError = false;
let redirectToLogin = null;

export function setAutoLogin(f) {
  autoLogin = f;
}

export function setRedirectToLogin(f) {
  redirectToLogin = f;
}

export function setLogError(b) {
  logError = b;
}

export function start() {

  // Set Middlewares

  app.disable('x-powered-by');
  app.locals.pretty = true;
  app.locals.appName = config.prop.appName;
  app.locals.appNamel = config.prop.appNamel;
  app.locals.appDesc = config.prop.appDesc;

  app.set('view engine', 'pug');
  app.set('views', 'code');

  app.use(cookieParser());

  let redisClient = redis.createClient({
    host: 'localhost',
    port: 6379,
    db: 1,
  });
  redisClient.unref();
  redisClient.on('error', console.log);

  app.use(session({
    store: new redisStore({ client: redisClient }),
    resave: false,
    saveUninitialized: false,
    secret: config.prop.cookieSecret
  }));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use(function (req, res, next) {
    res.locals.query = req.query;

    // Response 의 Content-Type 을 지정할 방법을 마련해 두어야한다.
    // 각 핸들러에서 res.send(), res.json() 으로 Content-Type 을 간접적으로 명시할 수도 있지만
    // 에러 핸들러는 공용으로 사용하기 때문에 이 방식에 의존할 수 없다.
    //
    // req.xhr:
    //   node + superagent 로 테스트할 시에는 Fail.
    //
    // req.is('json'):
    //   superagent 로 GET 할 경우 매번 type('json') 을 명시해야하며
    //   그렇게 한다 하여도 Content-Length: 0 인 GET 을 type-is 가 제대로 처리하지 못하고 null 을 리턴한다. Fail.
    //
    // 위와 같이 클라이언트에서 보내주는 정보에 의존하는 것은 불안정하다.
    // 해서 /api/ 로 들어오는 Request 에 대한 에러 Content-Type 은 일괄 json 으로 한다.
    // json 이외의 결과 타입을 원하는 클라이언트에서도 json 타입 에러를 처리하는 것은 크게 어려워보이지 않는다.

    res.locals.api = /^\/api\//.test(req.path);
    if (res.locals.api) {
      // IE 는 웹페이지까지만 refresh 하고 ajax request 는 refresh 하지 않는다.
      res.set('Cache-Control', 'no-cache');
    } else {
      // force web page cached.
      res.set('Cache-Control', 'private');
    }
    next();
  });

  // before: 인증 미들웨어용
  // after: redirect to login page 용
  // 테스트케이스에서 인스턴스가 기동한 후 핸들러를 추가하는 경우가 있어 core 를 도입.

  if (autoLogin) {
    app.use(autoLogin);
  }

  app.use(core);

  app.get('/api/hello', function (req, res, next) {
    res.json({
      name: config.prop.appName,
      time: Date.now()
    });
  });

  app.all('/api/echo', function (req, res, next) {
    res.json({
      method: req.method,
      rtype: req.header('content-type'),
      query: req.query,
      body: req.body
    });
  });

  // for test

  app.get('/test/error-sample', function (req, res, next) {
    const err = new Error('Error Sample');
    err.code = 999;
    next(err);
  });

  app.get('/api/error-sample', function (req, res, next) {
    const err = new Error('Error Sample');
    err.code = 999;
    next(err);
  });

  app.post('/api/destroy-session', function (req, res, next) {
    req.session.destroy();
    res.json({});
  });

  app.get('/api/cookies', function (req, res, next) {
    res.json(req.cookies);
  });

  // error handler

  if (redirectToLogin) {
    app.use(redirectToLogin);
  }

  app.use(function (_err, req, res, next) {
    const err = {
      message: _err.message,
      code: _err.code,
      errors: _err.errors,
    };
    //err.stack = ((_err.stack || '').match(/^(?:.*\n){1,8}/m) || [''])[0];
    err.stack = _err.stack;
    if (logError) {
      console.error('Code: ' + err.code);
      console.error(err.stack);
    }
    if (res.locals.api) {
      res.json({ err: err });
    } else {
      res.render('express/express-error', { err: err });
    }
  });

  app.listen(config.prop.appPort);
  console.log('express: listening ' + config.prop.appPort);
};
