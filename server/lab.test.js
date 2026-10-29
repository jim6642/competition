'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const {validateAnswers,rankCandidate} = require('./lab-matching');
const baseAnswers = () => ({intent:['join'],grade:'大二',discipline:['engineering'],interests:['hardware','robotics'],skills:['FPGA'],experience:'course',competition:['edc'],availability:'steady',preference:['complement']});

test('answers enforce enumerations, limits and exclusive beginner selection',()=>{
  assert.deepEqual(validateAnswers({...baseAnswers(),unexpected:'ignored'}),baseAnswers());
  assert.throws(()=>validateAnswers({...baseAnswers(),grade:'任意字符串'}),{status:400});
  assert.throws(()=>validateAnswers({...baseAnswers(),skills:['not-a-real-skill']}),{status:400});
  assert.throws(()=>validateAnswers({...baseAnswers(),interests:[]}),{status:400});
  assert.throws(()=>validateAnswers({...baseAnswers(),skills:['starting','Python']}),{status:400});
  assert.throws(()=>validateAnswers({...baseAnswers(),skills:Array(13).fill('Python')}),{status:400});
  assert.deepEqual(validateAnswers({...baseAnswers(),skills:['starting']}).skills,['starting']);
  assert.throws(()=>validateAnswers({...baseAnswers(),competition:['unsure','edc']}),{status:400});
  assert.throws(()=>validateAnswers({...baseAnswers(),competition:['edc','invented']}),{status:400});
  assert.throws(()=>validateAnswers({...baseAnswers(),competition:[]}),{status:400});
  assert.throws(()=>validateAnswers({...baseAnswers(),discipline:['engineering','science','arts','business']}),{status:400});
  assert.deepEqual(validateAnswers({...baseAnswers(),competition:['edc','robomaster','edc']}).competition,['edc','robomaster']);
  const legacy={...baseAnswers(),intent:'join',discipline:'engineering',competition:'edc',preference:'complement'};
  assert.deepEqual(validateAnswers(legacy),baseAnswers());
  assert.equal(legacy.competition,'edc');
});
test('multiple targets match any shared contest, preserve labels and cap preference weight',()=>{
  const answers={...baseAnswers(),intent:['join','recruit'],discipline:['engineering','science'],competition:['cumcm','edc'],preference:['complement','similar','mentor','peer']};
  const candidate={id:2,username:'test',profile:{},answers:{...baseAnswers(),intent:['join','recruit'],competition:['robomaster','edc'],discipline:['engineering','science'],skills:['ROS'],experience:'project'},posts:[]};
  const result=rankCandidate(answers,candidate);
  assert.ok(result.reasons.some(s=>s.includes('电子设计竞赛')));
  assert.deepEqual(result.competitions,['robomaster','edc']);
  assert.equal(result.major,'工科 / 理科');
  assert.ok(result.intent.includes('加入')&&result.intent.includes('缺人'));
  assert.equal(result.score,rankCandidate({...answers,preference:['complement']},candidate).score);
  assert.ok(result.score>rankCandidate({...answers,competition:['mcm']},candidate).score);
});
test('ranking prefers relevant complementary real capabilities but keeps other candidates',()=>{
  const candidate={id:2,username:'test',profile:{name:'test'},answers:{...baseAnswers(),intent:'recruit',skills:['ROS','OpenCV'],experience:'project'},posts:[]};
  const relevant=rankCandidate(baseAnswers(),candidate);
  const other=rankCandidate(baseAnswers(),{...candidate,id:3,answers:{...baseAnswers(),competition:'mcm',skills:['PPT'],interests:['writing'],availability:'light'}});
  assert.ok(relevant.score>other.score);
  assert.ok(relevant.reasons.some(s=>s.includes('可补充')));
  assert.equal(other.userId,3);
});

test('isolated API: opt-in visibility, private answers, real matching and authorized chat',{timeout:30000},async()=>{
  const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'competition-lab-test-'));
  const databasePath=path.join(tempDir,'test.sqlite');
  const child=spawn(process.execPath,[path.join(__dirname,'server.js')],{env:{...process.env,PORT:'0',HOST:'127.0.0.1',COMPETITION_DB_PATH:databasePath},stdio:['ignore','pipe','pipe']});
  let base;
  try {
    base=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('isolated server startup timed out')),10000);
      child.stdout.on('data',chunk=>{const found=String(chunk).match(/listening on (http:\/\/127\.0\.0\.1:\d+)/);if(found){clearTimeout(timer);resolve(found[1]);}});
      child.once('error',error=>{clearTimeout(timer);reject(error);});
      child.once('exit',code=>{clearTimeout(timer);reject(new Error(`isolated server exited (${code}) before startup`));});
    });
    async function request(route,method='GET',body,cookie) {
      const response=await fetch(base+route,{method,headers:{Origin:base,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
      return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
    }
    async function register(label) {
      const response=await request('/api/auth/register','POST',{username:`lab_${label}_${crypto.randomBytes(3).toString('hex')}`,password:crypto.randomBytes(18).toString('hex'),profile:{name:`测试${label}`,school:'测试大学',major:'测试专业',grade:'大三',skills:'Python',experience:'课程项目',competition:'edc',role:'开发',wanted:'视觉'}});
      assert.equal(response.status,201);
      return {cookie:response.cookie,id:response.data.user.id};
    }
    const [a,b,c,d]=await Promise.all(['a','b','c','d'].map(register));
    assert.equal((await request('/api/lab/profile')).status,401);
    const save=(user,discoverable,answers=baseAnswers())=>request('/api/lab/profile','PUT',{answers,discoverable},user.cookie);
    assert.equal((await save(a,false)).status,200);
    assert.equal((await save(b,true,{...baseAnswers(),intent:'recruit',skills:['ROS']})).status,200);
    // Simulate an already-saved v1 profile; migration is read-time and non-destructive.
    const Database=require('better-sqlite3');
    const legacyDb=new Database(databasePath);
    try {
      legacyDb.prepare('UPDATE lab_profiles SET answers_json=? WHERE user_id=?').run(JSON.stringify({...baseAnswers(),intent:'recruit',discipline:'engineering',competition:'edc',preference:'complement',skills:['ROS']}),b.id);
    } finally {legacyDb.close();}
    assert.equal((await save(c,false)).status,200);
    assert.equal((await request('/api/lab/profile','PUT',{answers:{...baseAnswers(),skills:['invalid']},discoverable:true},a.cookie)).status,400);
    const published=await request('/api/team-posts','POST',{competition:'edc',recruitCount:1,gaps:['视觉'],members:[]},d.cookie);
    assert.equal(published.status,201);
    const multiAnswers={...baseAnswers(),competition:['robomaster','edc'],preference:['complement','similar'],intent:['join','recruit']};
    assert.equal((await save(a,false,multiAnswers)).status,200);
    assert.deepEqual((await request('/api/lab/profile','GET',undefined,a.cookie)).data.answers.competition,['robomaster','edc']);
    const recommendations=await request('/api/lab/matches','POST',{answers:multiAnswers},a.cookie);
    assert.equal(recommendations.status,200);
    assert.deepEqual(new Set(recommendations.data.matches.map(p=>p.userId)),new Set([b.id,d.id]));
    assert.ok(recommendations.data.matches.every(p=>!('score' in p)&&!('password_hash' in p)&&!('answers_json' in p)));
    assert.ok(recommendations.data.matches.find(p=>p.userId===b.id).reasons.some(reason=>reason.includes('电子设计竞赛')));
    assert.equal((await request('/api/profile','GET',undefined,a.cookie)).data.profile.grade,'大三');
    assert.equal((await request('/api/conversations','POST',{labUserId:c.id},a.cookie)).status,404);
    assert.equal((await request('/api/conversations','POST',{labUserId:a.id},a.cookie)).status,404);
    const chat=await request('/api/conversations','POST',{labUserId:b.id},a.cookie);
    assert.equal(chat.status,200);
    const chatId=chat.data.conversationId;
    assert.equal((await request(`/api/conversations/${chatId}/messages`,'POST',{message:'一起做一个机器人项目。'},a.cookie)).status,201);
    assert.equal((await request(`/api/conversations/${chatId}/messages`,'GET',undefined,b.cookie)).data.messages.length,1);
    assert.equal((await request(`/api/conversations/${chatId}/messages`,'GET',undefined,c.cookie)).status,404);
    assert.equal((await request('/api/conversations','POST',{postId:published.data.post.id},a.cookie)).status,200);
    await save(b,false);
    assert.equal((await request('/api/conversations','POST',{labUserId:b.id},a.cookie)).status,404);
    assert.equal((await request(`/api/conversations/${chatId}/messages`,'GET',undefined,b.cookie)).status,200);
    const afterPause=await request('/api/lab/matches','POST',{answers:baseAnswers()},a.cookie);
    assert.deepEqual(afterPause.data.matches.map(p=>p.userId),[d.id]);
  } finally {
    if(child.exitCode===null){const ended=once(child,'exit');child.kill('SIGTERM');await ended;}
    for(const suffix of ['','-wal','-shm'])fs.rmSync(databasePath+suffix,{force:true});
    fs.rmdirSync(tempDir);
  }
});
