import {DurableObject} from 'cloudflare:workers';
import {HANDSHAKE_MS,hash,privateToken,randomCode,reserveCode} from './protocol.mjs';

export class RoomRegistry extends DurableObject {
  constructor(ctx,env){
    super(ctx,env);this.sql=ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS identities(token_hash TEXT PRIMARY KEY, id TEXT UNIQUE NOT NULL);
      CREATE TABLE IF NOT EXISTS codes(code TEXT PRIMARY KEY,room_id TEXT UNIQUE NOT NULL,owner TEXT NOT NULL,status TEXT NOT NULL,expires INTEGER);
      CREATE TABLE IF NOT EXISTS creations(owner TEXT NOT NULL,request_id TEXT NOT NULL,room_id TEXT NOT NULL,code TEXT NOT NULL,expires INTEGER NOT NULL,PRIMARY KEY(owner,request_id));
      CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS controllers(identity TEXT PRIMARY KEY,room_id TEXT NOT NULL,connection_id TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS limits_expiry ON limits(expires);`);
  }
  async session(){
    const token=privateToken(),id=crypto.randomUUID(),digest=await hash(token);
    this.sql.exec('INSERT INTO identities(token_hash,id) VALUES(?,?)',digest,id);return {token};
  }
  async identity(token){
    if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
    return this.sql.exec('SELECT id FROM identities WHERE token_hash = ?',await hash(token)).toArray()[0]?.id||null;
  }
  async rate(bucket,limit,windowMs){
    const now=Date.now(),row=this.sql.exec('SELECT count,expires FROM limits WHERE bucket = ?',bucket).toArray()[0];
    if(row&&row.expires>now&&row.count>=limit)return false;
    this.sql.exec('INSERT INTO limits(bucket,count,expires) VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET count=excluded.count,expires=excluded.expires',bucket,row&&row.expires>now?row.count+1:1,row&&row.expires>now?row.expires:now+windowMs);
    await this.schedule();return true;
  }
  async allocate(owner,id){
    const now=Date.now();let result;
    try{result=this.ctx.storage.transactionSync(()=>{
      const prior=this.sql.exec('SELECT room_id,code FROM creations WHERE owner=? AND request_id=?',owner,id).toArray()[0];
      if(prior){const active=this.sql.exec('SELECT code FROM codes WHERE room_id=?',prior.room_id).toArray()[0];return active?{roomId:prior.room_id,code:prior.code,existing:true}:{error:'ROOM_CLOSED'};}
      const roomId=crypto.randomUUID(),code=reserveCode(this.sql,randomCode,roomId,owner,now);
      this.sql.exec('INSERT INTO creations(owner,request_id,room_id,code,expires) VALUES(?,?,?,?,?)',owner,id,roomId,code,now+86400000);
      return {roomId,code,existing:false};
    });}catch{return {error:'NO_CAPACITY'};}
    await this.schedule();return result;
  }
  lookup(code){return this.sql.exec('SELECT room_id AS roomId,status FROM codes WHERE code=?',code).toArray()[0]||null;}
  claim(identity,roomId,connectionId){
    const previous=this.sql.exec('SELECT room_id,connection_id FROM controllers WHERE identity=?',identity).toArray()[0];
    this.sql.exec('INSERT INTO controllers(identity,room_id,connection_id) VALUES(?,?,?) ON CONFLICT(identity) DO UPDATE SET room_id=excluded.room_id,connection_id=excluded.connection_id',identity,roomId,connectionId);
    if(previous&&previous.room_id!==roomId)this.ctx.waitUntil(this.env.ROOMS.getByName(previous.room_id).revoke(identity,previous.connection_id).catch(()=>{}));
    return true;
  }
  current(identity,roomId,connectionId){return this.sql.exec('SELECT identity FROM controllers WHERE identity=? AND room_id=? AND connection_id=?',identity,roomId,connectionId).toArray().length===1;}
  releaseController(identity,roomId,connectionId){this.sql.exec('DELETE FROM controllers WHERE identity=? AND room_id=? AND connection_id=?',identity,roomId,connectionId);}
  async activate(code,roomId){
    const row=this.sql.exec('SELECT status,expires FROM codes WHERE code=? AND room_id=?',code,roomId).toArray()[0];
    if(!row||row.status==='pending'&&row.expires<Date.now())return false;
    this.sql.exec('UPDATE codes SET status=?,expires=NULL WHERE code=? AND room_id=?','active',code,roomId);await this.schedule();return true;
  }
  async release(code,roomId){this.sql.exec('DELETE FROM codes WHERE code=? AND room_id=?',code,roomId);this.sql.exec('DELETE FROM controllers WHERE room_id=?',roomId);await this.schedule();return true;}
  async schedule(){
    const next=this.sql.exec(`SELECT MIN(expires) AS n FROM (SELECT expires FROM codes WHERE status='pending' UNION ALL SELECT expires FROM limits UNION ALL SELECT expires FROM creations)`).toArray()[0]?.n;
    if(next)await this.ctx.storage.setAlarm(Math.max(Date.now()+1,next));else await this.ctx.storage.deleteAlarm();
  }
  async alarm(){
    const now=Date.now();this.sql.exec('DELETE FROM codes WHERE status=? AND expires<=?','pending',now);
    this.sql.exec('DELETE FROM limits WHERE expires<=?',now);this.sql.exec('DELETE FROM creations WHERE expires<=?',now);await this.schedule();
  }
}
