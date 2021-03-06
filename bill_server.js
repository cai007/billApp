var http = require('http');
var bill = require('./lib/bill');
var mysql = require('mysql');
var url = require('url');

function parasError(res) {
    console.log('222')
    res.statusCode = 500;
    res.setHeader('Content-Type', "text/plain;charset=UTF-8");
    res.end('参数错误!');
}

function badRequest(res) {
    console.log('111')
    res.statusCode = 400;
    res.setHeader('Content-Type', "text/plain;charset=UTF-8");
    res.end('请求错误!');
}
var server = new http.Server();

function askUrl(server, db) {
    server.on('request', (req, res) => {
        var urlInfo = url.parse(req.url, true);
        var pathname = urlInfo.pathname;
        var paras = urlInfo.query;
        switch (req.method) {
            case 'GET':
                switch (pathname) {
                    case '/users':
                        bill.showUsers(db, res);
                        break;
                    case '/types':
                        bill.showTypes(db, res);
                        break;
                    case '/showBillDetails':
                        if (paras && paras.family_id)
                            bill.showBillDetails(db, res, paras);
                        else
                            parasError(res);
                        break;
                    case '/showBills':
                        if (paras && paras.family_id)
                            bill.showBills(db, res, paras);
                        else
                            parasError(res);
                        break;
                    case '/showTypeDataByDate':
                        bill.showTypeDataByDate(db, res, paras);
                        break;
                    case '/showMonthBillsByDate':
                        bill.showMonthBillsByDate(db, res, paras);
                        break;
                    case '/showTypeDetailsByDate':
                        bill.showTypeDetailsByDate(db, res, paras);
                        break;
                    case '/showUserBalance':
                        bill.showUserBalance(db, res, paras);
                        break;
                    case '/showLastUsersBalance':
                        bill.showLastUsersBalance(db, res, paras);
                        break;
                    default:
                        badRequest(res);
                }
                break;
            case 'POST':
                switch (req.url) {
                    case '/':
                        bill.add(db, req, res);
                        break;
                    case '/deleteBill':
                        bill.deleteBill(db, req, res);
                        break;
                    case '/updateBill':
                        bill.updateBill(db, req, res);
                        break;

                    case '/addTypes':
                        bill.addTypes(db, req, res);
                        break;
                    case '/deleteTypes':
                        bill.deleteTypes(db, req, res);
                        break;
                    case '/updateUserBalance':
                        bill.updateUserBalance(db, req, res);
                        break;
                    case '/addUserBalance':
                        bill.addUserBalance(db, req, res);
                        break;
                    case '/deleteUserBalance':
                        bill.deleteUserBalance(db, req, res);
                        break;
                }
                break;
            default:
                badRequest(res);
        }
    })
}


function handleConnectError(err) {
    //连接超过一定时间没有活动后，会自动关闭该连接值默认8h，设置重连
    // if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    setTimeOut(function() {
        console.log('准备重启：**************************************')
        dbConnect();
    }, 3000);
    // }
}

function dbConnect() {
    //db不能当做全局变量 应该在每一次执行数据请求的时候去获取
    var db = mysql.createConnection({
        host: '193.112.9.85',
        user: 'root',
        password: '123456',
        database: 'my_bill'
    });
    askUrl(server, db);
    db.connect((err, result) => {
        if (err) {
            console.log('here is error:', err)
                // throw err;
            handleConnectError(err);
        }
        console.log('Server started...');
        server.listen(3000, '0.0.0.0');
    });
}

dbConnect();