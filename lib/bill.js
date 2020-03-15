var qs = require('querystring');

function badRequestCatch(res, err) {
    try {
        throw err;
    } catch (e) {
        console.log(e);
        var data = JSON.stringify(e);
        res.statusCode = 400;
        res.setHeader('Content-Type', "text/plain;charset=UTF-8");
        res.end(data);
    }
}


exports.sendHtml = function(res, html) {

    var data = JSON.stringify(html);
    // var data = html.join(',');
    res.setHeader('Content-Type', 'text/plain;charset=UTF-8');
    console.log(data)
        // res.setHeader('Content-Length', Buffer.byteLength(html));
    res.write(data);
    res.end();
}

exports.parseReceivedData = function(req, cb) {
    var body = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        body += chunk
    });
    req.on('end', function() {
        var data = qs.parse(body);
        cb(data);
    });
};

//查询所有收支类型
exports.showTypes = function(db, res) {
    var query = "select * from income_expenditure_type";
    db.query(
        query,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//添加收支分类
exports.addTypes = function(db, req, res) {
    exports.parseReceivedData(req, function(type) {
        if (type.is_incomes !== undefined) type.is_incomes = 0;
        if (type.is_bring_into_assets !== undefined) type.is_bring_into_assets = 1;
        if (type.is_consumption !== undefined) type.is_consumption = 1;

        db.query(
            "INSERT INTO income_expenditure_type (type_name,is_incomes,is_bring_into_assets,is_consumption) " +
            "VALUES (?, ?, ?, ?)", [type.type_name, type.is_incomes, type.is_bring_into_assets, type.is_consumption],
            function(err) {
                var msg = { 'data': 'insert success' }

                if (err) badRequestCatch(res, err);
                else
                    exports.sendHtml(res, msg);
            }
        );
    });
};

//删除收支分类
exports.deleteTypes = function(db, req, res) {
    exports.parseReceivedData(req, function(type) {
        db.query(
            "DELETE FROM income_expenditure_type WHERE type_id=?", [type.type_id],
            function(err) {
                if (err) badRequestCatch(res, err);
                else {
                    var msg = { 'data': 'delete success' }
                    exports.sendHtml(res, msg);
                }
            }
        );
    });
};

//添加账单信息
exports.add = function(db, req, res) {
    exports.parseReceivedData(req, function(bill) {
        if (bill.note == undefined) bill.is_incomes = '';
        db.query(
            "INSERT INTO bill_info (time, type_id, money,user_id,note) " +
            "VALUES (?, ?, ?, ?,?)", [bill.time, bill.type_id, bill.money, bill.user_id, bill.note],
            function(err) {
                if (err) badRequestCatch(res, err);
                else {
                    var msg = { 'data': 'success' }
                    exports.sendHtml(res, msg);
                }
            }
        );
    });
};

//删除账单信息
exports.deleteBill = function(db, req, res) {
    exports.parseReceivedData(req, function(bill) {
        db.query(
            "DELETE FROM bill_info WHERE bill_id=?", [bill.bill_id],
            function(err) {
                var msg = { 'data': 'delete success' }

                if (err) badRequestCatch(res, err);
                else exports.sendHtml(res, msg);
            }
        );
    });
};

//修改账单信息
exports.updateBill = function(db, req, res) {
    exports.parseReceivedData(req, function(bill) {
        db.query(
            "UPDATE bill_info SET time=?, type_id=?, money=?,user_id=?,note=? WHERE bill_id=?", [bill.time, bill.type_id, bill.money, bill.user_id, bill.note, bill.bill_id],
            function(err) {
                var msg = { 'data': 'update success' }

                if (err) badRequestCatch(res, err);
                else exports.sendHtml(res, msg);
            }
        );
    });
};



//查询账单明细
exports.showBillDetails = function(db, res, paras) {
    var month_sql = '';
    var user_sql = '';

    var parasArray = [paras.family_id];
    if (paras.month !== undefined) {
        month_sql = " and LEFT(b.time,6)=? ";
        parasArray.push(paras.month);
    }
    if (paras.user_id !== undefined) {
        user_sql = " and b.user_id=? ";
        parasArray.push(paras.user_id);
    }
    var query = "SELECT * from bill_info b left join income_expenditure_type t on b.type_id=t.type_id WHERE user_id in ( select user_id from user_info WHERE familys = ?)" +
        " and b.type_id <> '15' and b.type_id <> '16' and b.type_id <> '17'  " +
        month_sql + user_sql +
        " ORDER BY b.time desc"
    db.query(
        query, parasArray,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//查询年度账单信息
exports.showBills = function(db, res, paras) {
    var year_sql = '';
    var user_sql = '';

    var parasArray = [paras.family_id];
    if (paras.year !== undefined) {
        year_sql = " and LEFT(time,4)=?";
        parasArray.push(paras.year);
    }
    if (paras.user_id !== undefined) {
        user_sql = " and user_id=?";
        parasArray.push(paras.user_id);
    }
    var query = "SELECT LEFT(time,6) as t,cast(sum(money) as decimal(10,2)) as sumMoney from bill_info WHERE user_id in (" +
        "select user_id from user_info WHERE familys = ?)" + year_sql + user_sql +
        " and type_id <> '15' and type_id <> '16' and type_id <> '17'  " +
        " GROUP BY substring(time,1,6) ORDER BY t desc"

    db.query(
        query, parasArray,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//根据时间段统计账单分类消费
exports.showTypeDataByDate = function(db, res, paras) {
    console.log('dd', paras)
    var type_sql = '';
    var user_sql = '';

    var parasArray = [paras.family_id];
    parasArray.push(paras.startDate);
    parasArray.push(paras.endDate);

    if (paras.user_id !== undefined) {
        user_sql = " and b.user_id=? ";
        parasArray.push(paras.user_id);
    }
    if (paras.type_id !== undefined) {
        type_sql = " and b.type_id = ? ";
        parasArray.push(paras.type_id);
    }

    var query = "SELECT b.type_id,i.type_name,cast(sum(b.money) as decimal(10,2)) as sumMoney from bill_info b " +
        "left join income_expenditure_type i on b.type_id=i.type_id WHERE b.user_id in (" +
        "select user_id from user_info WHERE familys = ?) and LEFT(b.time,8)>? and LEFT(b.time,8)<? " +
        "and b.type_id <> '15' and b.type_id <> '16' and b.type_id <> '17' " +
        user_sql + type_sql +
        "GROUP BY b.type_id ORDER BY sumMoney desc"

    db.query(
        query, parasArray,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//根据时间段统计各月账单信息
exports.showMonthBillsByDate = function(db, res, paras) {
    var user_sql = '';

    var parasArray = [paras.family_id];
    parasArray.push(paras.startDate);
    parasArray.push(paras.endDate);

    if (paras.user_id !== undefined) {
        user_sql = " and user_id=?";
        parasArray.push(paras.user_id);
    }

    var query = "SELECT LEFT(time,6) as t,cast(sum(money) as decimal(10,2)) as sumMoney from bill_info WHERE user_id in (" +
        " select user_id from user_info WHERE familys = ?) and LEFT(time,6)>? and LEFT(time,6)<? " +
        user_sql +
        " and type_id <> '15' and type_id <> '16' and type_id <> '17' " +
        "GROUP BY substring(time,5,2) ORDER BY t desc"
    db.query(
        query, parasArray,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//根据时间段和类别查询详细账单
exports.showTypeDetailsByDate = function(db, res, paras) {
    var parasArray = [paras.family_id];
    parasArray.push(paras.startDate);
    parasArray.push(paras.endDate);
    parasArray.push(paras.type_id);

    var query = "SELECT * from bill_info WHERE user_id in (select user_id from user_info WHERE familys = ?) " +
        "and LEFT(time,8)>? and LEFT(time,8)<? and type_id = ? ORDER BY time desc"
    db.query(
        query, parasArray,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//查询所有用户
exports.showUsers = function(db, res) {
    var query = "select * from user_info";
    db.query(
        query,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};