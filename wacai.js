var http = require('http');
var fs = require('fs');
var querystring = require('querystring');

var post_data = {
    "cond.date": "2018-03-02",
    "cond.date_end": "2020-03-31",
    "cond.withDaySum": false,
    "pageInfo.pageIndex": 1,
    "cond.reimbursePrefer": 0
}



var time = new Date().getTime();
var options = {
    hostname: 'www.wacai.com',
    port: 80, //注意端口号 可以忽略不写 写一定写对
    path: '/biz/ledger_list.action?timsmp=' + time,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': '_jzqc=1; _jzqy=1.1583760030.1583760030.1.jzqsr=baidu.-; _jzqckmp=1; _qzjc=1; sajssdk_2015_cross_new_user=1; Hm_lvt_bc65f2f4ddfe3a1cda888f512e73f7f1=1583760097; pgv_pvi=1135042560; pgv_si=s5204878336; Hm_lpvt_bc65f2f4ddfe3a1cda888f512e73f7f1=1583760152; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22170bf745a3225b-02f8f984f6af16-4313f6a-1327104-170bf745a335e%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E8%87%AA%E7%84%B6%E6%90%9C%E7%B4%A2%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC%22%2C%22%24latest_referrer%22%3A%22https%3A%2F%2Fwww.baidu.com%2Flink%22%7D%2C%22%24device_id%22%3A%22170bf745a3225b-02f8f984f6af16-4313f6a-1327104-170bf745a335e%22%7D; __gads=ID=244e9b829c95d02d:T=1583760255:S=ALNI_MYlJiEZr_uRuyTsreUnK1GsdTQNuQ; Hm_lvt_0311e2d8c20d5428ab91f7c14ba1be08=1583760029,1583760640; JSESSIONID=328B35E86979265D28A7AA649DCB776B; wctk=WCeO2k48pqbEvrJPYLKsjjcpWdvdivsy6MtEA; wctk.sig=qpcqzVpDRTdgliYA32eLIXJIR0M; access_token=WCeO2k48pqbEvrJPYLKsjjcpWdvdivsy6MtEA; access_token.sig=M74jeF_GEI_XgZupX3FTxGJL5gw; _jzqa=1.3213510019170346000.1583760030.1583760030.1583764145.2; _jzqx=1.1583764145.1583764145.1.jzqsr=wacai%2Ecom|jzqct=/user/user%2Eaction.-; _qzja=1.1475972669.1583760030022.1583760030022.1583764145462.1583764145462.1583765335115..0.0.11.2; _qzjb=1.1583764145461.2.0.0.0; _qzjto=11.2.0; _jzqb=1.2.10.1583764145.1; Hm_lpvt_0311e2d8c20d5428ab91f7c14ba1be08=1583765335'
    }
};

var _data = [];

function postFun(index) {
    if (index > 44) return;
    post_data['pageInfo.pageIndex'] = index;
    var content = querystring.stringify(post_data);
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            var ledgers = JSON.parse(body).ledgers;
            _data = _data.concat(ledgers);
            // console.log('BODY: ' + JSON.stringify(_data));
            console.log('page ' + index + ' has finished!')
            postFun(index + 1)
            if (index == 44) {
                console.log('all finished!')
                let str = JSON.stringify(_data, "", "\t");
                fs.writeFile('data.json', str, function(err) {
                    if (err) { res.status(500).send('Server is error...') }
                })
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });



    req.write(content);
    req.end();
}
postFun(1);