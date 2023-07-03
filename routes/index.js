var express = require('express');
const { body, validationResult } = require('express-validator');
var router = express.Router();

var pool = require('./pool')

router.get('/', function(req, res) {
	res.render('../public/index.html');
})

// To show all the leaves in the database
router.get('/leaves', function(req, res) {
	const pagenumber = Math.abs(req.query.page) || 1;
	const pagelimit = Math.abs(req.query.limit) || 5;
	const order_by = req.query.order_by || "leave_id";
	pool.query(`SELECT * FROM leaves ORDER BY ${order_by} LIMIT ${pagelimit} OFFSET (${pagenumber} - 1) * ${pagelimit}`, (error, results) => {
		if(error){
			res.status(404).send(error.message)
		}else{
			res.status(200).json(results.rows);
		}
	})
})

router.get('/leave_student', function(req, res) {
	const username = req.query.username;
	pool.query(`SELECT * FROM leaves WHERE sid IN (SELECT sid FROM students WHERE reg_no = '${username}') ORDER BY out_time DESC LIMIT 10`, (error, results) => {
	  if (error) {
		res.status(500).send(error.message);
	  } else {
		res.status(200).json(results);
	  }
	});
});

router.get('/leave_proctor', function(req, res) {
	const username = req.query.username;
	pool.query(`SELECT leave_id, name, contact, out_time, in_time, proctor_approval as status, address, purpose FROM leaves inner join students ON students.sid=leaves.sid WHERE leaves.sid IN 
	(SELECT sid FROM students INNER JOIN employees ON students.proctor=employees.employee_id WHERE employee_reg_no='${username}')
	 AND proctor_approval IS null ORDER BY out_time DESC`, (error, results) => {
	  if (error) {
		res.status(500).send(error.message);
	  } else {
		res.status(200).json(results.rows);
	  }
	});
});

router.get('/leave_warden', function(req, res) {
	const username = req.query.username;
	pool.query(`SELECT leave_id, name, contact, out_time, in_time, warden_approval as status, address, purpose FROM leaves INNER JOIN students ON 
	leaves.sid=students.sid WHERE leaves.sid IN 
	(SELECT sid FROM students WHERE block in (SELECT hostel_id FROM hostel_admin INNER JOIN employees 
		ON employees.employee_id=hostel_admin.employee_id WHERE employee_reg_no='${username}')) AND warden_approval IS NULL 
		AND proctor_approval=1 ORDER BY out_time DESC`, (error, results) => {
	  if (error) {
		console.log(error.message);
		res.status(500).send(error.message);
	  } else {
		res.status(200).json(results.rows);
	  }
	});
});

router.post('/proctor_approve', function(req, res) {
	const data = req.body;
	console.log(data?.status);
	if(!data.status || !(data?.status == 1 || data?.status == -1)) {
		res.status(400).send("status not mentioned");
	} else {
		pool.query(`UPDATE leaves SET proctor_approval=${data.status} WHERE leave_id=${data.leave_id}`, (error, results) => {
			if (error) {
			  res.status(500).send(error.message);
			} else {
			  res.status(200).json(results);
			}
		  });
	}
});

router.post('/warden_approve', function(req, res) {
	const data = req.body;
	console.log(data?.status);
	if(!data.status || !(data?.status == 1 || data?.status == -1)) {
		res.status(400).send("status not mentioned");
	} else {
		pool.query(`UPDATE leaves SET warden_approval=${data.status} WHERE leave_id=${data.leave_id}`, (error, results) => {
			if (error) {
			  res.status(500).send(error.message);
			} else {
			  res.status(200).json(results);
			}
		  });
	}
});
  

// To show leave form of the given index
router.get('/leaves/:id', function(req, res){
	pool.query(`SELECT * FROM leaves WHERE leave_id = ${req.params.id}`, (error, results) => {
		if(error){
			res.status(404).send(error.message)
		}else{
			res.status(200).json(results.rows);
		}
	})
});


router
	.route("/leave")
// To insert a new leave form
	.post(
		body('in_time').custom((value, {req}) => {
			if((Date.parse(value) - Date.parse(req.body.out_time)) < 0){
				throw new Error('The In time should be after the out time')
			}
			return true;
		}),
		(req, res) => {
		const data = req.body;
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
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
	.put((req, res) => {
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
