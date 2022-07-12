var express = require('express');
var router = express.Router();

const Pool = require('pg').Pool

const pool = new Pool({
  user: process.env.USERNAME,
  host: process.env.HOST,
  database: 'leave_application',
  password: process.env.PASSWORD, 
  port: 5432,
})


router.get('/', function(req, res) {
	res.render('../public/index.html');
})

// To show all the leaves in the database
router.get('/leaves', function(req, res) {
	pool.query('SELECT * FROM leaves', (error, results) => {
		if(error){
			console.log(error.message)
			res.status(404)
		}else{
			res.status(200).json(results.rows);
		}
	})
});

// To show leave form of the given index
router.get('/leaves/:id', function(req, res){
	pool.query(`SELECT * FROM leaves WHERE leave_id = ${req.params.id}`, (error, results) => {
		if(error){
			console.log(error.message)
			res.status(404)
		}else{
			res.status(200).json(results.rows);
		}
	})
});

// To validate the put route of leave
function isValid(data, required){
	const error = new Error;
	for(let i = 0; i < required.length; i++){
		if(!(required[i] in data)){
			error.message = `The json is missing ${required[i]}\n`;
			return [false, error];
		}
	}
	console.log(Date.parse(data.in_time) - Date.parse(data.out_time))
	if((Date.parse(data.in_time) - Date.parse(data.out_time)) < 0){
		error.message = 'The in time is before the out time\n';
		return [false, error];
	}
	return [true, error];
}

router
	.route("/leave")
// To insert a new leave form
	.put((req, res) => {
		const data = req.body;
		const required = ["reg_no", "addr", "purpose", "out_time", "in_time"];
		let [validation, error] = isValid(data, required)
		if(!validation){
			res.status(422).send(error.message);
			return;
		}
		pool.query(`INSERT INTO leaves (sid, address, purpose, out_time, in_time) 
					VALUES ((SELECT sid from students WHERE reg_no='${data.reg_no}'), '${data.addr}', '${data.purpose}', '${data.out_time}', '${data.in_time}')RETURNING leave_id`, (error, results) =>{
			if(error){
				res.status(400).send(error.message)
			}else{
				res.status(201).send(`${results.rows[0].leave_id}\n`);
			}
		})
	})

// To update a leave form 
	.post((req, res) => {
		const data = req.body;
		pool.query(`UPDATE leaves SET address='${data.addr}', purpose='${data.purpose} WHERE leave_id=${data.leave_id}`, (error, results) =>{
			if(error){
				res.status(400).send(error.message)
			}else{
				res.status(201).send("Form Updated\n")
			}
		})
	})

// To delete a leave form
	.delete((req, res) => {
		const data = req.body;
		pool.query(`DELETE FROM leaves WHERE leave_id=${data.leave_id}`, (error, results) =>{
			if(error){
				res.status(400).send(error.message)
			}else{
				res.status(201).send("Form Deleted\n")
			}
		})
	})


module.exports = router;
