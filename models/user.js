/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    if (!username || !password || !first_name || !last_name || !phone){
      return new ExpressError('Missing information.', 404);
    }
    const hashPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const date = new Date();
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashPassword, first_name, last_name, phone, date, date]
    );
    return result.rows[0]
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password FROM users WHERE username = $1`, [username]
    );
    if (result.rows.length != 0){
      if (await bcrypt.compare(password, result.rows[0].password)){
        return true
      }
      return false;
    }
    return new ExpressError(`${username} does not exist.`, 400)
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const newDate = new Date();
    await db.query(
      `UPDATE users
      SET last_login_at = $1
      WHERE username = $2`,
      [newDate, username]
    );
    return {'message': 'Last login time updated.'}
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone 
      FROM users`
    );
    return result.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );
    if (result.rows.length == 0){
      return new ExpressError(`${username} does not exist.`, 404)
    }
    return result.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_username, body, sent_at, read_at}]
   *
   * where to_username is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const verify = await db.query(
      `SELECT username, first_name, last_name, phone FROM users WHERE username = $1`, [username]
    );
    if (verify.rows.length === 0){
      return new ExpressError(`${username} does not exist.`, 404)
    }
    const result = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1`,
      [verify.rows[0].username]
    );
    if (result.rows.length === 0){
      return "No messages detected."
    }
    for (let r of result.rows){
      const userInfo = await db.query(
        `SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1`,
        [r.to_username]
      );
      r.to_username = userInfo.rows[0]
    }
    return result.rows
  }

  /** Return messages to this user.
   *
   * [{id, from_username, body, sent_at, read_at}]
   *
   * where from_username is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const verify = await db.query(
      `SELECT username, first_name, last_name, phone FROM users WHERE username = $1`, [username]
    );
    if (verify.rows.length === 0){
      return new ExpressError(`${username} does not exist.`, 404)
    }
    const result = await db.query(
      `SELECT id, from_username, body, sent_at, read_at
      FROM messages
      WHERE to_username = $1`,
      [verify.rows[0].username]
    );
    if (result.rows.length === 0){
      return "No messages detected."
    }
    for (let r of result.rows){
      const userInfo = await db.query(
        `SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1`,
        [r.from_username]
      );
      r.from_username = userInfo.rows[0]
    }
    return result.rows
  }
}


module.exports = User;