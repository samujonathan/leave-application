CREATE TABLE IF NOT EXISTS status(
	status_id SERIAL PRIMARY KEY,
	status_type VARCHAR(50)
); 

INSERT INTO status (status_type) VALUES ('pending'), ('approved'), ('rejected');


CREATE TABLE IF NOT EXISTS students(
	sid SERIAL PRIMARY KEY,
	reg_no VARCHAR(10) UNIQUE NOT NULL,
	name VARCHAR(100) NOT NULL,
	perm_address VARCHAR(255) NOT NULL,
	contact VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS leaves(
	leave_id SERIAL PRIMARY KEY,
	sid INT NOT NULL,
	address VARCHAR(255) NOT NULL,
	purpose VARCHAR(255) NOT NULL,
	out_time TIMESTAMP NOT NULL,
	in_time TIMESTAMP NOT NULL,
	proctor_approval INT DEFAULT 1,
	warden_approval INT DEFAULT 1

	CONSTRAINT fk_leaves_students FOREIGN KEY (sid) REFERENCES students(sid),
	CONSTRAINT fk_proctor_status FOREIGN KEY (proctor_approval) REFERENCES status(status_id),
	CONSTRAINT fk_warden_status FOREIGN KEY (warden_approval) REFERENCES status(status_id),

);
