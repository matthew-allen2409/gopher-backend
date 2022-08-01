const express = require('express');
const mariadb = require('mariadb');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function createHash(plainText) {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainText, salt);
}

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

app.get('/api/pfp', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('USE gopherbackend');
    const imgUrl = await conn.query('SELECT img FROM users WHERE username = ?', [req.query.user]);
    res.sendFile(`${path.join(__dirname)}/img/${imgUrl[0].img}`);
  }
  catch (err) {
    res.sendStatus(404);
    console.log(err);
    throw err;
  }
  finally {
    if (conn) return conn.end();
  }
})

app.get('/api/open_activities', async (req, res) => {
   let conn;
    try {
      conn = await pool.getConnection();
      await conn.query('USE gopherbackend');
      const result = await conn.query("select open_activities.*, users.username, users.first_name, users.last_name, users.img from open_activities INNER JOIN users order by open_activities.created_at DESC LIMIT 25");
      res.send(result);
    } catch (err) {
      console.log(err);
      throw err;
    }
    finally {
      if (conn) return conn.end();
    }
});

app.post('/api/create_user', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('USE gopherbackend');
    const passwordHash = await createHash(req.body.password);
    const result = await conn.query('INSERT INTO users (username, first_name, last_name, password, img) VALUES (?, ?, ?, ?, "Skips.png")', [req.body.username, req.body.firstName, req.body.lastName, passwordHash]);
    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(409);
    console.log(err);
    // Alert of bad post
    // throw (err)
  } 
  finally {
    if (conn) return conn.end();
  }
});

app.post('/api/login', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection()
    await conn.query('USE gopherbackend');
    const query = await conn.query('SELECT password, user_num FROM users WHERE username = ?', [req.body.username]);
    const storedHash = query[0].password;
    const user_num = query[0].user_num;
    if (!storedHash) {
      throw 'Password not found in database'
    }
    const result = await bcrypt.compare(req.body.password, storedHash);

    const body = {
      time: Date(),
      user_num: user_num
    }

    const token = jwt.sign(body, process.env.JWT_SECRET_KEY);    
    result ? res.status(200).send({'JWT': token}) : res.sendStatus(400);
  }
  catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
  finally {
    if (conn) return conn.end();
  }
});

app.post('/api/create_event', async (req, res) => {
  let conn;
  try {
    const jwtData = jwt.verify(req.body.JWT, process.env.JWT_SECRET_KEY);
    conn = await pool.getConnection();
    await conn.query('USE gopherbackend');
    const result = await conn.query('INSERT INTO open_activities (activity, additional_info, user_num, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [req.body.activity, req.body.info, jwtData.user_num]);
    res.sendStatus(201);
  }
  catch (err) {
    res.sendStatus(409);
    console.log(err);
  }
  finally {
    if (conn) return conn.end()
  }
});
 
app.listen(PORT, () => console.log(`Listening on ${process.env.PORT}...`));
