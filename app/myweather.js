var fs = require('fs');
var restify = require('restify');
var express = require('express');
var request = require('request');
var app = express();
var path = require('path');
//localhost
var nano = require ('nano')('http://localhost:5984');
//set port to 300
var port = process.env.PORT || 3000
//couchDB's name
var couchdb = nano.use('userinfo_weather');

var server = restify.createServer({
	name : 'Simple restify server'
});

//faovrite list parameters
var id = "";
var arrayCountry = [];
var arrayNote = [];
var country = "";

server.use(function(req, res, next){
	return next();
});

server.use(restify.bodyParser());

//route and function
server.post('/register', register);
server.post('/login', login);
server.get('/api/weather/:id', weather);
server.get('/api/weather/addfavorite/:id', addfavorite);
server.get('/api/weather/delfavorite/:id', delfavorite);
server.get('/api/listfavorite', listfavorite);
server.get('/', home);
server.get('js/client.js', client);

server.listen(port, function(err){
	if(err)
		console.error(err)
	else
		console.log('App is ready at : ' + port)
});

//to the home page
function home(req, res, next){
	console.log('called');
	console.log(__dirname);
    fs.readFile(__dirname + '/home.html', function (err, data) {
        if (err) {
            next(err);
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
}

//to the home page
function client(req, res, next){
    console.log(__dirname);
    fs.readFile(__dirname + '/js/client.js', function (err, data) {
        if (err) {
            next(err);
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(data);
        next();
    });
}

//login
function login(req, res, next){
	couchdb.view('login', 'login',{'key':req.body.email,'value':req.body.password,'include_docs':true}, function(err, body){
		if(!err){
			console.log(body.rows.length);
			if(body.rows.length == 1 ){
				//start login
                 id = body.rows[0].id;
				console.log('login success');
                 res.end("<html><head><title>Welcome</title></head><body><div id=\"whitearea\"><form id=\"form3\" method=\"post\" action='http://localhost:3000/api/weather/' enctype=\"multipart/form-data\"><h1>Weather Information</h1><div><label for=\"email\">Country</label><input type=\"text\" name=\"country\" id=\"country\"/></div><input type=\"submit\" value=\"Search\"/></form></div></body></html>");
			}else{
				console.log('login failed');
				res.end("<html><head><title>Register</title></head><body><div>Login Failed, Incorrect email or password!<form method=\"get\" action=\"http://localhost:3000/\"><input type=\"submit\" value=\"Back\"></form></body></html>");
			}

		}else{
			console.log(err);
		}
	});
}

//check duplication of email
function register(req, res, next){
	couchdb.view('listofuser', 'listofuser',{'key':req.body.email,'include_docs':false}, function(err, body){
		if(!err){
			console.log(body.rows.length);
			if(body.rows.length == 0){
				//start register
				console.log('start register');	
				createAccount(req, res, next)		
			}else{
				console.log('duplicate email');
				res.end("<html><head><title>Register</title></head><body><div>Duplicate Email!<form method=\"get\" action=\"http://localhost:3000/\"><input type=\"submit\" value=\"Back\"></form></body></html>");
			}
	
		}else{
			console.log(err);
		}
	});
}

//start create account 
function createAccount(req, res, next){

	var arr = [];
	
	req.body.favoritelist = arr;
	req.body.note = arr;
	
	couchdb.insert(req.body, function(err,body){
		console.log('registration' + req.params.path);
		if(!err){
			//alert register succes
			res.end("<html><head><title>Register</title></head><body><div>Registration Success, Welcome " + req.body.username + "<form method=\"get\" action=\"http://localhost:3000/\"><input type=\"submit\" value=\"Home\"></form></body></html>");
			res.end();
		}else{
			res.json(err);
		}
		res.send();
	});
}

//get weather 
function weather(req, res, next){
	console.log('called');
	if (!req.params.id) { 
           res.status(500); 
           res.send({"Error": "Empty Country Name"}); 
       }
       console.log(req.params.id);
       request.get({ url: 'http://api.openweathermap.org/data/2.5/forecast?q=' + req.params.id + '&appid=11d07f8d6cc74fb2628e68f0ad0edd8a'},
       function(error, response, body) { 
              if (!error && response.statusCode == 200) {
                   country = req.params.id;
                   if (country != null){
                   res.end(body);
                   }else{
                   	res.end('<html><head><title>Weather</title></head><body><div>Weather From :' + req.params.id + '<form method=\"get\"action=\"http://localhost:3000/\"><input type=\"submit\" value=\"Back\"></form><form id="form2" method="post" action="http://localhost:3000/api/weather/addfavorite" enctype="multipart/form-data"><div><label for="email">Note</label><input type="text" name="note" id="Add This Country to my list"/></div><input type="submit" value="Login"/></form><div><button >' + body + '</div></body></html>");}');
                   }
                 } 
             }); 
}

//update favorite list
function addfavorite(req, res, next){

	var errinsert;
    couchdb.view('favoritelist', 'favoritelist', {'key': id, 'include_docs': true}, function(err, body){
        if(!err){
            var doc_id = body.rows[0].id;
            var doc = body.rows[0].doc;
            
            arrayCountry = doc.favoritelist;
            arrayNote = doc.note;
            
            var duplicate = 'no'
            
            for (i=0;i<arrayCountry.length;i++){
				if(arrayCountry[i] == country){
					duplicate = 'yes';
				}
			}	
            
            if(duplicate == 'yes'){
            	console.log('duplicate');
            	console.log(country);
            	res.end(country + ' already exist');
            }else{
            	arrayCountry.push(country);
            	
            	console.log('call' + arrayCountry);
            	
            	console.log(req.params.id);
            	arrayNote.push(req.params.id);
            	
            //updates
            doc.favoritelist = arrayCountry;
            doc.note = arrayNote;
            
            couchdb.insert(doc, doc_id, function(err, res){
                if(!err){
                    console.log('updated');
                }else{
                	errinsert = errl
                	res.json('Error:' + err);
                }      
             });	
            } 
        }
    });
    
    if(!errinsert){
      	res.end('Country and Note are added');
    }
}

//delfavorite
function delfavorite(req, res, next){

	var errinsert;
	
	couchdb.view('favoritelist', 'favoritelist', {'key': id, 'include_docs': true}, function(err, body){
        if(!err){
            var doc_id = body.rows[0].id;
            var doc = body.rows[0].doc;
            var newArrCountry = [];
            var newArrNote = [];
            var found;
          	
            arrayCountry = doc.favoritelist;
            arrayNote = doc.note;
            
            for (i=0;i<arrayCountry.length;i++){
				if(arrayCountry[i] != req.params.id){
					console.log(arrayCountry[i]);
					console.log(arrayCountry[i]);
					newArrCountry.push(arrayCountry[i]);
					newArrNote.push(arrayNote[i]);
				}else{
					found = 'yes';
				}
			}	
                        
            doc.favoritelist = newArrCountry;
          	doc.note = newArrNote;
          	
          	console.log(newArrCountry);
          	console.log(newArrNote);
            
           	couchdb.insert(doc, doc_id, function(err, res){
           	if(!err){
                console.log('deleted');
            }else{
                errinsert = errl
            	}      
        	}); 		
        }
    });
    
    if(errinsert){
    	res.end(errinsert);
    }else{
    	res.end('deleted');
    } 
}

//listfavorite
function listfavorite(req, res, next){	
	couchdb.view('favoritelist', 'favoritelist', {'key': id, 'include_docs': true}, function(err, body){
        if(!err){
            var doc_id = body.rows[0].id;
            var doc = body.rows[0].doc;
            res.end('COUNTRY LIST : ' + doc.favoritelist + ' NOTE : ' + doc.note);
        }
    });
}





