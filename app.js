var express     = require('express');
var co          = require('co');

var app         = express();
var multiparty  = require('multiparty');
var util        = require('util');
var fs          = require('fs');
var xsl         = require("node-xlsx")
var index       = "";
var uploadFile  = "upload/ex/"
var rtrim       = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g

/* mysql */
var server     = app.listen(3000);
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123123',
  database : 'students'
});
var columns   = "uuid,name,sex,tel,qq,freshs,school,education,major,company,jd,money,worktime"
var insterSql = "insert into info ("+columns+") values"
var sqlcont   = []
/* end mysql*/
app.get('/', function(req, res, next) {
    fs.readFile("./views/index.html", function(err, data) {
        console.log(data)
        if (err) {
            return err
        }
        index = data  +  ""
        console.log(data)
      res.send(index);
    })
});
app.post('/upload', function (req, res, next) {
 console.log(req.url,req.method)

  var form = new multiparty.Form();
      form.uploadDir = uploadFile;
      form.parse(req, function(err, fields, files) {
        var upFiles = files.upload,
            len     = upFiles.length;
        co(function *(){
          while(len--){
            if (upFiles[len].originalFilename === "") { res.send("<div>无文件</div>");return;}
            yield Promise.resolve(len).then(function (val) {
              var s  = new Promise(function  (resolve,reject) {
                  fs.rename(upFiles[val].path,uploadFile+upFiles[val].originalFilename,function (err) {
                      var html = ""
                      var list = xsl.parse(uploadFile+upFiles[val].originalFilename);
                      var tHtml = ""
                      for (var i = 0; i < list.length; i++) {
                        for (var j = 4; j < list[i].data.length; j++) {
                          if (list[i].data[j].length > 0) {
                            var row  = ""
                            var len  = 14
                            var sqlRowValue = []

                            for (var l = 0; l < len; l++) {
                                if (l == 0 && !list[i].data[j][l]) {
                                  continue;
                                }
                                var tempValue = list[i].data[j][l] || "wu"
                                if (typeof tempValue === "string") {
                                    tHtml = tempValue.replace( rtrim, "" )
                                    tempValue = "\'"+tempValue.replace( rtrim, "" )+ "\'"
                                }

                                sqlRowValue.push(tempValue);
                                row += "<span class=\"row\">"+tempValue+"</span>"
                            }

                            /*
                             * 加行
                            */
                            row = "<div class=\"flex\">"+row+"</div>"
                            html += row;

                            if (isNaN(Number(sqlRowValue[0]))) {
                              /*
                               * 补齐
                              */
                              sqlRowValue.unshift("0123456789")
                            }
                            if (sqlRowValue[1] !== "\'wu\'") {
                              sqlcont.push("("+sqlRowValue.slice(0,13).join(",")+")")
                            }
                          }
                        }
                      }
                      resolve()
                      if (val == 0 ) {
                        res.status(200);
                        res.set({'content-type': 'text/html'})
                        // connection.connect();
                        connection.query(insterSql + sqlcont.join(",")+";", function(err, rows, fields) {
                          if (err) throw err;
                          console.log('excel import sucess');
                        });
                        // connection.end();

                        // console.log(sqlcont.join(","))
                        // res.send(util.inspect({fields: list[1]["data"], files: files}));
                        res.send(html.replace(/\'/,""))
                      }
                 })
              })
              return s
            })
          }
        }).catch(function(err){
          console.error(err.stack);
        });

    });
    return;
})
var isQuery = false;

app.get('/getStudent', function(req, res, next) {
  var sqlStr = "SELECT * FROM info WHERE {{column}} LIKE \'%{{qs}}%\';"
  var Qs = req.query.qs;
  var keys = columns.split(",")
  var html = ""
  var column = "name"
  var sqls = ""
  // if (!isQuery) {
  //   connection.connect();
  //   isQuery = true;
  // }
  if(Qs){
    if (Qs.match(/^\d+$/)) {
      column = "tel"
    }
    sqls = sqlStr.replace(/\{\{qs\}\}/g,Qs).replace(/\{\{column\}\}/g,column)
    connection.query({sql:sqls, timeout: 6000}, function(err, rows, fields) {
      if (err) throw err;
      console.log(rows);
      if (rows.length) {
        res.json({data:rows,mes:"success"})
      }else{
        res.json({data:[],mes:"failed"})
      }
    })
  }
});
app.use(express.static('./public'));





/* 上传*/
