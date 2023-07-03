var express = require('express');
const bcrypt = require('bcrypt');
const rounds = 10;
var router = express.Router();

var pool = require('./pool');

/* GET users listing. */
router
	.route('/')
	.get((req, res) => {
		pool.query('SELECT * FROM students', (error, response) => {
			if(error){
				res.status(400).send(error.message)
			}else{
				res.status(201).send(response.rows);
			}
		});
	})
	
	.post((req, res) => {
		const data = req.body;
		pool.query('INSERT INTO students () VALUES ()', (error, response) => {
			if(error){
				res.status(400).send(error.message)
			}else{
				res.status(201).send(response.rows);
			}
		});
	})

router.post('/signup', function(req, res) {
		const data = req.body;
		const account_type = data.account_type || 1;// its 1 for students
		const saltRounds = 10;
		const yourPassword = data.password;
		bcrypt.genSalt(saltRounds, (err, salt) => {
			bcrypt.hash(yourPassword, salt, (err, hash) => {
				if(account_type == 1) {
					pool.query(`INSERT INTO accounts (reg_no, passhash, account_type, detail_id) VALUES
					('${data.userName}', '${hash}', ${account_type}, (select sid from students where reg_no='${data.userName}'))`, (error, result) => {
						if(error){
							res.status(404).send(error.message);
						}else{
							res.status(200).send('successful');
						}
						
					})
				} else {

					console.log(req.body);
					pool.query(`INSERT INTO accounts (reg_no, passhash, account_type, detail_id) VALUES
					('${data.userName}', '${hash}', ${account_type}, (select employee_id from employees where employee_reg_no='${data.userName}'))`, (error, result) => {
						if(error){
							res.status(404).send(error.message);
						}else{
							res.status(200).send('successful');
						}
						
					})
				}
				
			});
		});

})


router.post('/login', function(req, res) {
		const data = req.body;
		console.log(data);
		const yourPassword = data.password;	
		pool.query(`SELECT (passhash) FROM accounts WHERE reg_no='${data.userName}' AND account_type=${data.account_type}`, (error, result) => {
			if(error){
				res.status(404).send(error.message)
			}else{
				bcrypt.compare(yourPassword, result.rows[0]?.passhash, (err, pass) => {
					if(err) {
						console.log(err);
						res.status(400).send(err.message);
					} else {
						if(!pass) {
							console.log("incorrect password");
							res.status(401).send("Incorrect password");
						} else {
							let cookie_val = {
								reg_no:data.userName
							}
							res.cookie('userCookie', cookie_val)
							res.send("Correct");
						}
					}
					
				})
			}
		})
})

module.exports = router;
