const express = require('express');
const mariadb = require('mariadb');
require('dotenv').config();

const PORT = process.env.PORT || 3001

const pool = mariadb.createPool({
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,  
    connectionLimit: 5
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/api', (req, res) => {
  res.json({"message": "Hello from server!"})
});

app.get('/api/open_activities', async (req, res) => {
  let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('USE gopherbackend');
      const result = await conn.query("select open_activities.*, users.username, users.first_name, users.last_name, users.img from open_activities INNER JOIN users order by open_activities.created_at LIMIT 25");
      res.send(result);
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      if (conn) return conn.end();
    }
});

app.post('/api/create_user', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('USE gopherbackend');
    const result = await conn.query(`INSERT INTO users (username, first_name, last_name, password) VALUES ('${req.body.username}', '${req.body.firstName}', '${req.body.lastName}', '${req.body.password}')`);
    res.status().send(201);
  } catch (err) {
    res.status().send(409);
    console.log(err);
    // Alert of bad post
    throw (err)
  } 
  finally {
    if (conn) return conn.end();
  }
});

app.post('/api/create_event', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('USE gopherbackend');
    const result = await conn.query(`INSERT INTO open_activities (activity, additional_info, user_num) VALUES ('${req.body.activity}', '${req.body.info}', ${req.body.user_num})`);
    res.status().send(201);
  }
  catch (err) {
    res.status().send(409);
    console.log(err);
    throw (err);
  }
  finally {
    if (conn) return conn.end();
  }
})
 
app.listen(process.env.PORT, () => console.log(`Listening on ${process.env.PORT}...`));
