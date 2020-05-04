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
            "INSERT INTO bill_info (time, type_id, money,user_id,get_user_id,note) " +
            "VALUES (?, ?, ?, ?,?,?)", [bill.time, bill.type_id, bill.money, bill.user_id, bill.get_user_id || '', bill.note],
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
    var tab_sql = '';

    var parasArray = [paras.family_id];
    if (paras.month !== undefined) {
        month_sql = " and LEFT(b.time,6)=? ";
        parasArray.push(paras.month);
    }
    if (paras.user_id !== undefined) {
        user_sql = " and b.user_id=? ";
        parasArray.push(paras.user_id);
    }
    if (paras.tab !== undefined) {
        tab_sql = " and t.tab=? ";
        parasArray.push(paras.tab);
    }
    var query = "SELECT * from bill_info b left join income_expenditure_type t on b.type_id=t.type_id WHERE user_id in ( select user_id from user_info WHERE familys = ?)" +
        month_sql + user_sql + tab_sql +
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
    var tab_sql = '';

    var parasArray = [paras.family_id];
    if (paras.year !== undefined) {
        year_sql = " and LEFT(b.time,4)=?";
        parasArray.push(paras.year);
    }
    if (paras.user_id !== undefined) {
        user_sql = " and b.ser_id=?";
        parasArray.push(paras.user_id);
    }
    if (paras.tab !== undefined) {
        tab_sql = " and t.tab=? ";
        parasArray.push(paras.tab);
    }
    var query = "SELECT LEFT(b.time,6) as t,cast(sum(b.money) as decimal(10,2)) as sumMoney from bill_info b left join income_expenditure_type t on b.type_id=t.type_id WHERE b.user_id in (" +
        "select user_id from user_info WHERE familys = ?)" +
        year_sql + user_sql + tab_sql +
        " GROUP BY substring(b.time,1,6) ORDER BY t desc"

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
    var date_sql = 'and LEFT(b.time,8)>=? and LEFT(b.time,8)<=? ';
    var tab_sql = "";

    var parasArray = [paras.family_id];
    parasArray.push(paras.startDate);
    parasArray.push(paras.endDate);

    if (paras.startDate !== undefined && paras.startDate.length == 6 && paras.endDate !== undefined && paras.endDate.length == 6) {
        date_sql = 'and LEFT(b.time,6)>=? and LEFT(b.time,6)<=? ';
    }

    if (paras.user_id !== undefined) {
        user_sql = " and b.user_id=? ";
        parasArray.push(paras.user_id);
    }
    if (paras.type_id !== undefined) {
        type_sql = " and b.type_id = ? ";
        parasArray.push(paras.type_id);
    }
    if (paras.tab !== undefined) {
        tab_sql = " and i.tab=? ";
        parasArray.push(paras.tab);
    }

    var query = "SELECT b.type_id,i.type_name,cast(sum(b.money) as decimal(10,2)) as sumMoney from bill_info b " +
        "left join income_expenditure_type i on b.type_id=i.type_id WHERE b.user_id in (" +
        "select user_id from user_info WHERE familys = ?) " +
        date_sql + user_sql + type_sql + tab_sql +
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
    var tab_sql = '';

    var parasArray = [paras.family_id];
    parasArray.push(paras.startDate);
    parasArray.push(paras.endDate);

    if (paras.user_id !== undefined) {
        user_sql = " and b.user_id=?";
        parasArray.push(paras.user_id);
    }
    if (paras.tab !== undefined) {
        tab_sql = " and t.tab=? ";
        parasArray.push(paras.tab);
    }

    var query = "SELECT LEFT(b.time,6) as t,cast(sum(b.money) as decimal(10,2)) as sumMoney from bill_info  b left join income_expenditure_type t on b.type_id=t.type_id WHERE b.user_id in (" +
        " select user_id from user_info WHERE familys = ?) and LEFT(time,6)>=? and LEFT(time,6)<=? " +
        user_sql + tab_sql +
        "GROUP BY substring(b.time,1,6) ORDER BY t desc"
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
    var date_sql = ' and LEFT(time,8)>=? and LEFT(time,8)<=? ';
    var parasArray = [paras.family_id];
    parasArray.push(paras.startDate);
    parasArray.push(paras.endDate);
    parasArray.push(paras.type_id);
    parasArray.push(paras.endDate);
    if (paras.startDate !== undefined && paras.startDate.length == 6 && paras.endDate !== undefined && paras.endDate.length == 6) {
        date_sql = ' and LEFT(time,6)>=? and LEFT(time,6)<=? ';
    }

    var query = "SELECT * from bill_info WHERE user_id in (select user_id from user_info WHERE familys = ?) " + date_sql +
        " and type_id = ? ORDER BY time desc"
    db.query(
        query, parasArray,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//查询家庭各成员余额
exports.showUserBalance = function(db, res, paras) {
    var time_sql = '';

    var parasArray = [];

    if (paras.time !== undefined) {
        time_sql = " and b.time<? ";
        parasArray.push(paras.time);
        parasArray.push(paras.time);
        parasArray.push(paras.time);
    }
    parasArray.push(paras.family_id);
    console.log('参数：', parasArray)
    var query = "SELECT b.user_id, cast(b.balance as decimal(10,2))-cast(if(p.pay is null,0,p.pay) as decimal(10,2))+cast(if(i.income is null,0,i.income) as decimal(10,2))+cast(if(t.transfer is null,0,t.transfer) as decimal(10,2)) as bmoney from balance b left join (" +
        "select b.user_id,SUM(b.money) as pay from bill_info b left join income_expenditure_type i on b.type_id=i.type_id left join balance ba on b.user_id = ba.user_id WHERE  (i.tab='0' or i.tab='2') and b.time>ba.time " + time_sql + " GROUP BY b.user_id) p on b.user_id = p.user_id " +
        "left join (select b.user_id,SUM(b.money) as income from bill_info b left join income_expenditure_type i on b.type_id=i.type_id left join balance ba on b.user_id = ba.user_id WHERE i.tab='1' and b.time>ba.time " + time_sql + " GROUP BY b.user_id) i on b.user_id = i.user_id " +
        "left join (select b.get_user_id,SUM(b.money) as transfer from bill_info b left join income_expenditure_type i on b.type_id=i.type_id left join balance ba on b.get_user_id = ba.user_id WHERE i.tab='2' and b.time>ba.time " + time_sql + " GROUP BY b.get_user_id ) t on b.user_id = t.get_user_id" +
        " where b.family_id=? GROUP BY b.user_id "
    db.query(
        query, parasArray,
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//查询上次设置家庭用户余额
exports.showLastUsersBalance = function(db, res, paras) {
    var query = "select * from balance WHERE family_id=?"
    db.query(
        query, [paras.family_id],
        function(err, rows) {
            if (err) badRequestCatch(res, err);
            else exports.sendHtml(res, rows);
        }
    );
};

//修改家庭用户余额
exports.updateUserBalance = function(db, req, res) {
    exports.parseReceivedData(req, function(bl) {
        db.query(
            "UPDATE balance set time=? , balance=? where family_id = ? and user_id=?", [bl.time, bl.balance, bl.family_id, bl.user_id],
            function(err) {
                var msg = { 'data': 'update success' }

                if (err) badRequestCatch(res, err);
                else exports.sendHtml(res, msg);
            }
        );
    });
};

//添加家庭用户初始余额
exports.addUserBalance = function(db, req, res) {
    exports.parseReceivedData(req, function(bl) {
        db.query(
            "insert into balance (user_id,time,balance,family_id) VALUES (?,?,?,?)", [bl.user_id, bl.time, bl.balance, bl.family_id],
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

//删除家庭用户余额信息
exports.deleteUserBalance = function(db, req, res) {
    exports.parseReceivedData(req, function(bl) {
        db.query(
            "delete from balance where family_id=? and user_id = ?", [bl.family_id, bl.user_id],
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