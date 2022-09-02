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
		const account_type = 1;// its 1 for students
		const saltRounds = 10;
		const yourPassword = data.password;
		bcrypt.genSalt(saltRounds, (err, salt) => {
			bcrypt.hash(yourPassword, salt, (err, hash) => {
				pool.query(`INSERT INTO accounts (reg_no, passhash, account_type, detail_id) VALUES
					('${data.userName}', '${hash}', ${account_type}, (select sid from students where reg_no='${data.userName}'))`, (error, result) => {

						if(error){
							res.status(404).send(error.message);
						}else{
							res.status(200).send('successful');
						}
						
					})
			});
		});

})


router.get('/login', function(req, res) {
		const data = req.body;
		const yourPassword = data.password;	
		pool.query(`SELECT (passhash) FROM accounts WHERE reg_no='${data.userName}'`, (error, result) => {
			if(error){
				res.status(404).send(error.message)
			}else{
				bcrypt.compare(yourPassword, result.rows[0].passhash, (err, pass) => {
					if(err) res.status(404).send(err.message);
					if(!pass) res.status(401).send("Incorrect password");
					let cookie_val = {
						reg_no:data.userName
					}
					res.cookie('userCookie', cookie_val)
					res.send("Correct");
				})
			}
		})
})

module.exports = router;
