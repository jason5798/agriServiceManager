var express = require('express');
var router = express.Router();
var config = require('../config');
var JsonFileTools =  require('../modules/jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/test.json';
var accountPath =  './public/data/account.json';
var hour = 60*60*1000;
var test = true;
var crypto = require('crypto');
var moment = require('moment');
var axios = require('axios');
var isToken = false;

module.exports = function(app) {
	app.get('/', checkLogin);
	app.get('/', function (req, res) {
			/*var testObj = JsonFileTools.getJsonFromFile(path2);
			test = testObj.test;
			res.render('index', {
				title: '首頁',
				device: null,
				test: test
			});*/
			res.redirect('/map');
	});

	app.get('/login', checkNotLogin);
	app.get('/login', function (req, res) {
		req.session.user = null;
		var name = req.flash('post_name').toString();
		var successMessae,errorMessae;
		console.log('Debug register get -> name:'+ name);

		if(name ==''){
			errorMessae = '';
			res.render('user/login', { title: 'Login',
				error: errorMessae
			});
		}else{
			var password = req.flash('post_password').toString();
			var url = 'http://'+config.host+':' + config.hostPort + '/user' + config.baseurl+'login/gemtek';
			// url = 'http://localhost:8001/user/v1/login/gemtek';
			axios.post(url, {
					acc: name,
					pwd: password,
					type: 0
			})
			.then(function (response) {
				console.log(response.data);
				if (response.data.responseCode === '000') {
					req.session.user = response.data;
					req.flash('error', null);
					return res.redirect('/');
				} else {
					res.render('user/login', { title: 'Login',
					error: response.data.responseMsg
				});
				}
				
			})
			.catch(function (error) {
				console.log(error);
				return res.redirect('/login');
			});
		}
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function (req, res) {
		var post_name = req.body.account;
		var	post_password = req.body.password;
		console.log('Debug login post -> name:'+post_name);
		console.log('Debug login post -> password:'+post_password);
		req.flash('post_name', post_name);
		req.flash('post_password', post_password);
		return res.redirect('/login');
		
	});

	app.get('/logout', function (req, res) {
		req.session.user = null;
		req.flash('success', '');
		res.redirect('/login');
	});
    app.get('/account', checkLogin);
    app.get('/account', function (req, res) {

		console.log('render to account.ejs');
		var refresh = req.flash('refresh').toString();
		var myuser = req.session.user;
		var successMessae,errorMessae;
		var post_name = req.flash('name').toString();

		console.log('Debug account get -> refresh :'+refresh);

		try {
			var userObj = JsonFileTools.getJsonFromFile(accountPath);
		}
		catch (event) {
			userObj = {};
		}
		if(refresh == 'delete'){
			successMessae = 'Delete account ['+post_name+'] is finished!';
		}else if(refresh == 'edit'){
			successMessae = 'Edit account ['+post_name+'] is finished!';
		}
		var newUsers = [];
		var keys = Object.keys(userObj);
		for(var i=0;i<  keys.length;i++){
			//console.log('name : '+users[i]['name']);
			if( keys[i] !== 'admin'){
				newUsers.push(userObj[keys[i]]);
			}
		}
		console.log('Debug account get -> users:'+newUsers.length+'\n'+newUsers);

		//console.log('Debug account get -> user:'+mUser.name);
		res.render('user/account', { title: '帳戶管理', // user/account
			user:myuser,//current user : administrator
			users:newUsers,//All users
			error: errorMessae,
			success: successMessae
		});
	});

	app.post('/account', checkLogin);
  	app.post('/account', function (req, res) {
  		var	post_name = req.body.postName;
		var postSelect = req.body.postSelect;
		console.log('post_name:'+post_name);
		console.log('postSelect:'+postSelect);
		var successMessae,errorMessae;
		req.flash('name',post_name);//For refresh users data
		try {
			var userObj = JsonFileTools.getJsonFromFile(accountPath);
		}
		catch (event) {
			userObj = {};
		}

		if(postSelect == ""){//Delete mode

			delete userObj[post_name];

		}else if(postSelect == "new"){//New account

			var md5 = crypto.createHash('md5');
            var	password = md5.update(req.body.password).digest('hex');
            userObj[post_name] = {"name":post_name,"password":password,"level":1,"enable":true,"date":moment().format("YYYY/MM/DD hh:mm:ss")};

	    }else{//Edit modej

			console.log('postSelect :'+typeof(postSelect) );
			userObj[post_name]['enable'] = (postSelect==="false")?false:true ;
		}
		JsonFileTools.saveJsonToFile(accountPath,userObj);
		setTimeout(function() {
			return res.redirect('/account');
		}, 500);

  	});

    //app.get('/map', checkLogin);
    app.get('/map', function (req, res) {
		var postType = req.flash('type').toString();
		var successMessae,errorMessae;
		errorMessae = req.flash('error').toString();
		var user = req.session.user;
		var token = null;
		if (config.isNeedLogin) {
			token = encodeURI(user.authToken);
		}
		var url = 'http://'+config.host+':' + config.hostPort + '/map' + config.baseurl;
		// url = 'http://localhost:8001/map/v1/';
		var index = 0;
		
		axios.get(url,{
			params: {
			  token: token
			}
		  })
		.then(function (response) {
			console.log(JSON.stringify(response.data));
			var maps = response.data.data;
			var target = null;
			if (postType) {
				target = getMap(maps, postType);
			}
			if (response.data.responseCode === '000') {
				
				res.render('map', { title: '裝置類型', 
					target: target,//current map
					maps: maps,//All maps
					error: errorMessae,
					success: successMessae
				});
			} else {
				res.render('map', { title: '裝置類型', 
					target:null,//current map
					maps:null,//All maps
					error: errorMessae,
					success: successMessae
				});
			}
			
		})
		.catch(function (error) {
			res.render('map', { title: '裝置類型', 
					target:null,//current map
					maps:null,//All maps
					error: errorMessae,
					success: successMessae
				});
		});
	});
  
	app.post('/map', checkLogin);
  	app.post('/map', function (req, res) {
  		var	postType = req.body.postType;
		var postSelect = req.body.postSelect;
		var user = req.session.user;
	    var token = encodeURI(user.authToken);
		var error = '';
		var mapObj = {};
		var fieldNameObj = {};
		if (postSelect == 'new' || postSelect == 'edit') {
			try {
				var field = req.body.field;
				var start = req.body.start;
				var	end = req.body.end;
				var method = req.body.method;
				var fieldName = req.body.fieldName;

				if (field) {
					if (field && typeof(field) === 'string') {
						mapObj[field] = [Number(start), Number(end), method];
						fieldNameObj[field] = fieldName;
					} else {
						for (let i=0; i<field.length; ++i) {	
							//New map if exist has same data
							if(mapObj[field]) {
								req.flash('error', '輸入感測類型重複');
								return res.redirect('/map');
							}	
							mapObj[field[i]] = [Number(start[i]), Number(end[i]), method[i]];
							fieldNameObj[field[i]] = fieldName[i];
						}
					}
				}
			} catch (error) {
				console.log(error);
				req.flash('error', error);
				return res.redirect('/map');
				return;
			}
			
		}
		
		console.log('postType:' + postType);
		console.log('postSelect:' + postSelect);
		var url = 'http://'+config.host+':' + config.hostPort + '/map' + config.baseurl;
		
		if(postSelect == "del"){//Delete mode
			//Del map
			axios.delete(url, {
				data: {
					token:token,
					deviceType: postType
				  }
				})
			.then(function (response) {
				console.log(response.data);
				if (response.data.responseCode === '000') {
					return res.redirect('/map');
				} else {
					req.flash('error', response.data.responseMsg);
					return res.redirect('/map');
				}
			})
			.catch(function (error) {
				req.flash('error', error);
				return res.redirect('/map');
			});
			
		}else if(postSelect == "new"){//New account
			//new map
			axios.post(url, {
				    token: token,
					deviceType: postType,
					typeName: req.body.typeName,
					fieldName: fieldNameObj,
					map: mapObj,
					createUser: user.userInfo.name
				})
			.then(function (response) {
				console.log(response.data);
				if (response.data.responseCode === '000') {
					req.flash('error', '');
					return res.redirect('/map');
				} else {
					req.flash('error', response.data.responseMsg);
					return res.redirect('/map');
				}
			})
			.catch(function (error) {
				req.flash('error', error);
				return res.redirect('/map');
			});

	    }else if(postSelect == "edit"){
			//Edit 
			axios.put(url, {
					token:token,
					deviceType: postType,
					typeName: req.body.typeName,
					fieldName: fieldNameObj,
					map: mapObj,
					updateUser: user.userInfo.name
				})
			.then(function (response) {
				console.log(response.data);
				if (response.data.responseCode === '000') {
					return res.redirect('/map');
				} else {
					req.flash('error', response.data.responseMsg);
					return res.redirect('/map');
				}
			})
			.catch(function (error) {
				req.flash('error', error);
				return res.redirect('/map');
			});
		} else {
			//Select map
			req.flash('error', '');
			return res.redirect('/map');
		}
  	});

	app.get('/find', checkLogin);
	app.get('/find', function (req, res) {
		var testObj = JsonFileTools.getJsonFromFile(path2);
		test = testObj.test;
		console.log('render to post.ejs');
		var find_mac = req.flash('mac').toString();
		var successMessae,errorMessae;
		var count = 0;
		console.log('mac:'+find_mac);

		if(find_mac.length>0){
			res.render('find', {
						title: '查詢',
						devices: null,
						test:test
					});
		}else{
			console.log('find_name.length=0');
			res.render('find', {
				title: '查詢',
				devices: null,
				test:test
		});
		}

	});

	app.post('/find', function (req, res) {
			var	 post_mac = req.body.mac;
			console.log('find mac:'+post_mac);
			req.flash('mac', post_mac);
			return res.redirect('/find');
	});

	app.get('/setting', checkLogin);
	app.get('/setting', function (req, res) {
			res.render('setting', {
				title: '設定'
			});
	});

	// Jason add on 2017.11.16
	app.get('/finalList', function (req, res) {
			var testObj = JsonFileTools.getJsonFromFile(path2);
			test = testObj.test;
			var now = new Date().getTime();
			var device = null,
				finalList = null;
			try{
				finalList = JsonFileTools.getJsonFromFile(path);
			} catch(e) {
				console.log('Get finalList error : ' + e);
				finalList = {};
				JsonFileTools.saveJsonToFile(path, finalList);
			}
			if (finalList === null) {
				finalList = {};
			}

			var keys = Object.keys(finalList);
			if (keys.length > 0) {
				device = finalList[keys[0]];
			}

			res.render('finalList', {
				title: '最新資訊',
				finalList:finalList,
				test: test
			});
	});

	app.get('/devices', function (req, res) {
			var	mac = req.query.mac;
			var	date = req.query.date;
			var	option = req.query.option;
			var testObj = JsonFileTools.getJsonFromFile(path2);
			test = testObj.test;

			res.render('devices', {
				title: '裝置列表',
				mac:mac,
				date: date,
				test: test,
				option
			});
	});
};

function checkLogin(req, res, next) {
	if (!req.session.user && config.isNeedLogin) {
	  req.flash('error', 'No Register!');
	  res.redirect('/login');
	}else{
		next();
	}
}

function checkNotLogin(req, res, next) {
	if (req.session.user) {
		req.flash('error', 'Have login!');
		res.redirect('back');//返回之前的页面
	}else
	{
		next();
	}
}

function getMap(maps, type) {
	var map = null;
	for(let a=0; a<maps.length; ++a) {
		let obj = maps[a];
		if (Object.is(obj.deviceType, type) ) {
			map = JSON.parse(JSON.stringify(obj));
			break;
		}
	}
	return map;
}