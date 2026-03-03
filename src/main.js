const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const DATA_PATH = path.join(app.getPath('userData'), 'datame-v1.json');
const CONFIG_PATH = path.join(app.getPath('userData'), 'datame-config.json');

function getConfig() {
  try { if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH,'utf-8')); } catch(e){}
  return { apiKey: '', provider: 'openai' };
}
function saveConfig(cfg) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg,null,2)); }

function getDefaultVault() {
  return {
    categories: {
      identity:   { icon:'👤', label:'基础身份',       color:'#3478f6', builtin:true, fields:{ 姓名:'', 曾用名:'', 出生日期:'', 出生地:'', 性别:'', 国籍:'', 身份证:'', 护照:'', 驾照:'', 港澳通行证:'', 社保卡:'', 正面照片:'', 身高:'', 体重:'', 血型:'' }},
      contact:    { icon:'📮', label:'联系与定位',     color:'#0ea5e9', builtin:true, fields:{ 手机号码:'', 备用手机:'', 常用邮箱:'', 备用邮箱:'', 微信号:'', 现居住地址:'', 户籍地址:'', 工作地址:'' }},
      health:     { icon:'🏥', label:'医疗与健康',     color:'#50c878', builtin:true, fields:{ 血型:'', 身高:'', 体重:'', 慢性病:'', 手术记录:'', 过敏史:'', 家族遗传病:'', 疫苗接种:'', 长期用药:'', 体检报告:'', 主治医生:'', 常用医院:'', 紧急联系人:'' }},
      psychology: { icon:'🧠', label:'心理与人格',     color:'#a855f7', builtin:true, fields:{ MBTI:'', 九型人格:'', 学习方式:'', 决策风格:'', 压力应对:'', 沟通风格:'', 重要人生事件:'', 人生目标:'', 核心价值观:'', 信仰:'' }},
      education:  { icon:'🎓', label:'教育与学历',     color:'#f59e0b', builtin:true, fields:{ 大学:'', 专业:'', 研究生:'', 语言能力:'', 专业技能:'', 职业资格证:'', 荣誉奖项:'' }},
      career:     { icon:'💼', label:'职业与事业',     color:'#e74c3c', builtin:true, fields:{ 当前雇主:'', 职位:'', 工作年限:'', 专业领域:'', 职业目标:'', 月收入范围:'' }},
      relations:  { icon:'👨‍👩‍👧', label:'家庭与社会关系', color:'#f5a623', builtin:true, fields:{ 父亲:'', 母亲:'', 兄弟姐妹:'', 伴侣:'', 子女:'', 祖父母:'', 重要朋友:'', 导师:'' }},
      assets:     { icon:'🏠', label:'资产与财务',     color:'#10b981', builtin:true, fields:{ 房产:'', 车辆:'', 银行卡:'', 支付宝:'', 微信支付:'', 证券账户:'', 基金理财:'', 保险:'' }},
      legal:      { icon:'⚖️', label:'法律与合规',     color:'#ec4899', builtin:true, fields:{ 劳动合同:'', 房屋合同:'', 交通罚单:'', 违章记录:'', 遗嘱:'', 知识产权:'' }},
      interests:  { icon:'🎵', label:'兴趣与生活',     color:'#06b6d4', builtin:true, fields:{ 音乐风格:'', 常听歌手:'', 影视偏好:'', 书单:'', 饮食偏好:'', 忌口:'', 运动项目:'', 旅行偏好:'', 常用App:'' }},
      ai_logs:    { icon:'💬', label:'AI对话记录',     color:'#8b5cf6', builtin:true, fields:{ ChatGPT:'', Claude:'', DeepSeek:'', 其他AI:'' }},
      accounts:   { icon:'🔐', label:'账号与密码',     color:'#f59e0b', builtin:true, fields:{ 常用邮箱:'', 社交平台:'', 购物平台:'', WiFi密码:'', 门锁密码:'' }},
      chats:      { icon:'💭', label:'聊天记录',       color:'#22d3ee', builtin:true, fields:{} },
      inbox:      { icon:'📥', label:'待分类收件箱',   color:'#6366f1', builtin:true, fields:{} },
    },
    customCategories: {},
    chatImports: [],
    inboxFiles: [],
  };
}

function loadVault() {
  try { if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH,'utf-8')); } catch(e){}
  return getDefaultVault();
}
function saveVault(data) { fs.writeFileSync(DATA_PATH, JSON.stringify(data,null,2)); }

// ── OpenAI API ───────────────────────────────────────────────
function callAI(apiKey, prompt, imageBase64, mediaType) {
  return new Promise((resolve, reject) => {
    const content = imageBase64
      ? [
          { type:'image_url', image_url:{ url:`data:${mediaType||'image/jpeg'};base64,${imageBase64}` }},
          { type:'text', text:prompt }
        ]
      : prompt;

    const body = JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{ role:'user', content }]
    });

    const req = https.request({
      hostname:'api.openai.com', path:'/v1/chat/completions', method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data).choices?.[0]?.message?.content || ''); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function analyzeFile(apiKey, filePath, ext, fileName) {
  const fieldMap = {
    identity:   ['姓名','曾用名','出生日期','出生地','性别','国籍','身份证','护照','驾照','港澳通行证','社保卡','身高','体重','血型'],
    contact:    ['手机号码','备用手机','常用邮箱','备用邮箱','微信号','现居住地址','户籍地址','工作地址'],
    health:     ['血型','身高','体重','慢性病','手术记录','过敏史','家族遗传病','疫苗接种','长期用药','主治医生','常用医院','紧急联系人'],
    psychology: ['MBTI','九型人格','学习方式','决策风格','压力应对','沟通风格','重要人生事件','人生目标','核心价值观','信仰'],
    education:  ['大学','专业','研究生','语言能力','专业技能','职业资格证','荣誉奖项'],
    career:     ['当前雇主','职位','工作年限','专业领域','职业目标','月收入范围'],
    relations:  ['父亲','母亲','兄弟姐妹','伴侣','子女','祖父母','重要朋友','导师'],
    assets:     ['房产','车辆','银行卡','支付宝','微信支付','证券账户','基金理财','保险'],
    legal:      ['劳动合同','房屋合同','交通罚单','违章记录','遗嘱','知识产权'],
    interests:  ['音乐风格','常听歌手','影视偏好','书单','饮食偏好','忌口','运动项目','旅行偏好','常用App'],
    accounts:   ['常用邮箱','社交平台','购物平台','WiFi密码','门锁密码'],
  };

  const catDesc = Object.entries(fieldMap).map(([k,fields])=>`${k}(可用字段:${fields.join('|')})`).join('\n');

  const prompt = `你是 datame 个人数据分析助手。分析内容，提取个人信息，严格按以下格式返回JSON（不要其他文字）：
{"suggestedCategory":"分类key","confidence":0到100的数字,"summary":"一句话描述","extractedFields":{"字段名":"值"},"tags":["标签"]}

规则：
1. suggestedCategory 必须是下面列出的分类key之一
2. extractedFields 的字段名必须使用对应分类的"可用字段"中的名称，完全匹配中文字段名
3. confidence 表示你对分类判断的把握度，护照/身份证图片应≥90
4. 如果是护照，suggestedCategory用 identity，提取：姓名、出生日期、性别、国籍、护照（号码）、出生地

可用分类及字段：
${catDesc}`;

  try {
    const imgExts = ['.jpg','.jpeg','.png','.heic','.webp','.gif'];
    if (imgExts.includes(ext)) {
      const mime = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.heic':'image/jpeg'}[ext]||'image/jpeg';
      const stat = fs.statSync(filePath);
      if (stat.size > 5*1024*1024) return { suggestedCategory:'inbox', confidence:30, summary:fileName, extractedFields:{}, tags:['图片过大'] };
      const b64 = fs.readFileSync(filePath).toString('base64');
      const imgPrompt = `我正在录入我自己的证件信息到个人数据库。请帮我读取这张图片上所有可见的文字字段，严格按以下JSON格式返回（不要其他文字）：
{"suggestedCategory":"分类key","confidence":90,"summary":"一句话描述","extractedFields":{"中文字段名":"值"},"tags":["标签"]}

如果是护照，suggestedCategory用identity，extractedFields包含：姓名、护照、出生日期、出生地、性别、国籍、有效期至、签发日期
如果是身份证，suggestedCategory用identity，extractedFields包含：姓名、身份证、出生日期、出生地、性别、国籍、现居住地址
如果是驾照，suggestedCategory用identity，extractedFields包含：姓名、驾照、出生日期
如果是体检报告，suggestedCategory用health
如果是其他图片，根据内容判断分类，extractedFields列出所有可见文字字段

请读取图片中所有可见的文字并填入对应字段值。`;
      const r = await callAI(apiKey, imgPrompt, b64, mime);
      return JSON.parse(r.replace(/```json|```/g,'').trim());
    }

    const textExts = ['.txt','.md','.csv','.json','.html','.htm'];
    let content = '';
    if (textExts.includes(ext)) {
      content = fs.readFileSync(filePath,'utf-8').slice(0,5000);
    } else {
      const stat = fs.statSync(filePath);
      content = `文件名:${fileName} 大小:${(stat.size/1024).toFixed(1)}KB 修改:${stat.mtime} 格式:${ext}`;
    }
    const r = await callAI(apiKey, prompt+`\n\n文件内容:\n${content}`);
    return JSON.parse(r.replace(/```json|```/g,'').trim());
  } catch(e) {
    console.error('[analyzeFile ERROR]', fileName, e.message, e.stack);
    return { suggestedCategory:'inbox', confidence:0, summary:fileName, extractedFields:{}, tags:[] };
  }
}

// ── Window ───────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width:1200, height:780, minWidth:900, minHeight:600,
    titleBarStyle:'hiddenInset', backgroundColor:'#080810',
    webPreferences:{ nodeIntegration:false, contextIsolation:true, preload:path.join(__dirname,'preload.js') },
  });
  win.loadFile(path.join(__dirname,'index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit(); });
app.on('activate', ()=>{ if(BrowserWindow.getAllWindows().length===0) createWindow(); });

// ── IPC ──────────────────────────────────────────────────────
ipcMain.handle('vault:load', () => loadVault());
ipcMain.handle('config:load', () => getConfig());
ipcMain.handle('config:save', (_, cfg) => { saveConfig(cfg); return true; });

ipcMain.handle('vault:save-field', (_, {category,field,value}) => {
  const v=loadVault(); const cat=v.categories[category]||v.customCategories[category];
  if(cat){cat.fields[field]=value;saveVault(v);} return true;
});
ipcMain.handle('vault:add-custom-category', (_, {id,icon,label,color}) => {
  const v=loadVault(); v.customCategories[id]={icon,label,color,builtin:false,fields:{}}; saveVault(v); return true;
});
ipcMain.handle('vault:add-custom-field', (_, {category,fieldName}) => {
  const v=loadVault(); const cat=v.categories[category]||v.customCategories[category];
  if(cat){cat.fields[fieldName]='';saveVault(v);} return true;
});
ipcMain.handle('vault:delete-custom-category', (_, {id}) => {
  const v=loadVault(); delete v.customCategories[id]; saveVault(v); return true;
});

// 扫描文件夹
ipcMain.handle('vault:scan-folder', async () => {
  const result = await dialog.showOpenDialog({ properties:['openDirectory'] });
  if(result.canceled) return null;
  const files=[];
  function scan(dir,depth=0){
    if(depth>3)return;
    try {
      for(const e of fs.readdirSync(dir,{withFileTypes:true})){
        if(e.name.startsWith('.'))continue;
        const full=path.join(dir,e.name);
        if(e.isDirectory()){scan(full,depth+1);continue;}
        const ext=path.extname(e.name).toLowerCase();
        const cat=categorizeFile(ext);
        if(cat){const stat=fs.statSync(full);files.push({name:e.name,path:full,ext,suggestedCategory:cat,size:stat.size,modified:stat.mtime,status:'pending',aiAnalysis:null});}
      }
    }catch(e){}
  }
  scan(result.filePaths[0]);
  const v=loadVault();
  const existingPaths = new Set((v.inboxFiles||[]).map(f=>f.path));
  const newFiles = files.filter(f=>!existingPaths.has(f.path));
  v.inboxFiles=[...(v.inboxFiles||[]),...newFiles];
  saveVault(v); return newFiles;
});

// AI分析单个文件
ipcMain.handle('vault:ai-analyze', async (_, {filePath,ext,fileName}) => {
  const cfg=getConfig();
  const analysis=await analyzeFile(cfg.apiKey,filePath,ext,fileName);
  const v=loadVault();
  v.inboxFiles=(v.inboxFiles||[]).map(f=>f.path===filePath?{...f,aiAnalysis:analysis,suggestedCategory:analysis?.suggestedCategory||f.suggestedCategory}:f);
  saveVault(v); return analysis;
});

// AI批量自动归档
ipcMain.handle('vault:ai-auto-import', async (_, {filePaths}) => {
  const cfg=getConfig();
  const v=loadVault(); const results=[];
  for(const filePath of filePaths){
    const fileName=path.basename(filePath);
    const ext=path.extname(fileName).toLowerCase();
    const analysis=await analyzeFile(cfg.apiKey,filePath,ext,fileName);
    if(!analysis)continue;
    const catKey=analysis.suggestedCategory;
    const cat=v.categories[catKey]||v.customCategories[catKey];
    if(cat&&analysis.confidence>=60){
      Object.entries(analysis.extractedFields||{}).forEach(([field,value])=>{if(value)cat.fields[field]=value;});
      cat.fields[`📎 ${fileName}`]=filePath;
      v.inboxFiles=(v.inboxFiles||[]).map(f=>f.path===filePath?{...f,status:'archived',archivedTo:catKey,aiAnalysis:analysis}:f);
      results.push({filePath,fileName,catKey,analysis,status:'archived'});
    } else {
      v.inboxFiles=(v.inboxFiles||[]).map(f=>f.path===filePath?{...f,aiAnalysis:analysis}:f);
      results.push({filePath,fileName,catKey,analysis,status:'pending'});
    }
  }
  saveVault(v); return results;
});

// 手动归档
ipcMain.handle('vault:inbox-assign', (_, {filePath,category,fieldName}) => {
  const v=loadVault(); const cat=v.categories[category]||v.customCategories[category];
  if(cat){
    cat.fields[fieldName||path.basename(filePath)]=filePath;
    v.inboxFiles=(v.inboxFiles||[]).map(f=>f.path===filePath?{...f,status:'archived',archivedTo:category}:f);
    saveVault(v);
  } return true;
});

// 删除收件箱条目
ipcMain.handle('vault:inbox-delete', (_, {filePath}) => {
  const v = loadVault();
  v.inboxFiles = (v.inboxFiles||[]).filter(f => f.path !== filePath);
  saveVault(v); return true;
});

// 撤回归档（移回 pending）
ipcMain.handle('vault:inbox-unarchive', (_, {filePath}) => {
  const v = loadVault();
  v.inboxFiles = (v.inboxFiles||[]).map(f => f.path===filePath ? {...f, status:'pending', archivedTo:undefined} : f);
  saveVault(v); return true;
});

// 导入聊天
ipcMain.handle('vault:import-chat', async (_, {platform}) => {
  const filters={
    whatsapp:[{name:'WhatsApp',extensions:['txt','zip']}],
    telegram:[{name:'Telegram',extensions:['json']}],
    chatgpt: [{name:'ChatGPT', extensions:['json']}],
    claude:  [{name:'Claude',  extensions:['json']}],
    dingtalk:[{name:'钉钉',   extensions:['html','csv','txt']}],
    feishu:  [{name:'飞书',   extensions:['html','csv','json']}],
    wechat:  [{name:'微信',   extensions:['html','txt','csv']}],
  };
  const result=await dialog.showOpenDialog({properties:['openFile'],filters:filters[platform]||[{name:'所有',extensions:['*']}]});
  if(result.canceled)return null;
  const filePath=result.filePaths[0];
  const content=fs.readFileSync(filePath,'utf-8');
  const parsed=parseChatFile(platform,content,filePath);
  const cfg=getConfig();
  let aiInsights=null;
  if(cfg.apiKey&&parsed.messages.length>0){
    try{
      const sample=parsed.messages.slice(0,60).map(m=>`${m.role}: ${m.text}`).join('\n');
      const r=await callAI(cfg.apiKey,`分析这段聊天记录，提取关于用户本人的个人信息，返回JSON（不要其他文字）：{"extractedFields":{"字段名":"值"},"summary":"摘要","topics":["话题"]}\n\n${sample}`);
      aiInsights=JSON.parse(r.replace(/```json|```/g,'').trim());
      // 自动写入相关分类
      const v2=loadVault();
      Object.entries(aiInsights.extractedFields||{}).forEach(([f,val])=>{
        if(!val)return;
        const fl=f.toLowerCase();
        if(fl.includes('姓名')||fl.includes('名字'))v2.categories.identity.fields['姓名']=v2.categories.identity.fields['姓名']||val;
        else if(fl.includes('邮箱'))v2.categories.contact.fields['常用邮箱']=v2.categories.contact.fields['常用邮箱']||val;
        else if(fl.includes('电话')||fl.includes('手机'))v2.categories.contact.fields['手机号码']=v2.categories.contact.fields['手机号码']||val;
        else if(fl.includes('职位')||fl.includes('工作'))v2.categories.career.fields['职位']=v2.categories.career.fields['职位']||val;
        else if(fl.includes('学校')||fl.includes('大学'))v2.categories.education.fields['大学']=v2.categories.education.fields['大学']||val;
      });
      saveVault(v2);
    }catch(e){}
  }
  const v=loadVault();
  v.chatImports=v.chatImports||[];
  v.chatImports.push({platform,filePath,importedAt:new Date().toISOString(),messageCount:parsed.messages.length,contacts:parsed.contacts,summary:parsed.summary,aiInsights});
  v.categories.chats.fields[`${platform}_${Date.now()}`]=`${platform} | ${parsed.messages.length}条 | ${filePath}`;
  saveVault(v);
  return {...parsed,aiInsights};
});

function parseChatFile(platform,content,filePath){
  try{
    if(['telegram','chatgpt','claude','feishu'].includes(platform)){
      const data=JSON.parse(content);
      if(platform==='chatgpt'){
        const msgs=[];
        (Array.isArray(data)?data:[data]).forEach(conv=>{
          if(conv.mapping)Object.values(conv.mapping).forEach(n=>{
            if(n.message?.content?.parts)msgs.push({role:n.message.author?.role||'unknown',text:n.message.content.parts.join(' '),time:n.message.create_time});
          });
        });
        return{messages:msgs,contacts:['ChatGPT'],summary:`${msgs.length}条对话`};
      }
      if(platform==='claude'){
        const msgs=[];
        (Array.isArray(data)?data:[data]).forEach(conv=>{(conv.chat_messages||[]).forEach(m=>msgs.push({role:m.sender,text:m.text||'',time:m.created_at}));});
        return{messages:msgs,contacts:['Claude'],summary:`${msgs.length}条对话`};
      }
      if(platform==='telegram'){
        const msgs=(data.messages||[]).map(m=>({role:m.from||'?',text:typeof m.text==='string'?m.text:'',time:m.date}));
        return{messages:msgs,contacts:[...new Set(msgs.map(m=>m.role))],summary:`${msgs.length}条`};
      }
    }
    if(platform==='whatsapp'){
      const msgs=content.split('\n').map(l=>{const m=l.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.*)$/);return m?{role:m[3].trim(),text:m[4].trim(),time:`${m[1]} ${m[2]}`}:null;}).filter(Boolean);
      return{messages:msgs,contacts:[...new Set(msgs.map(m=>m.role))],summary:`${msgs.length}条`};
    }
    const lines=content.split('\n').filter(l=>l.trim());
    return{messages:lines.map(l=>({role:'unknown',text:l,time:''})),contacts:[],summary:`${lines.length}行`};
  }catch(e){return{messages:[],contacts:[],summary:'解析失败'};}
}

function categorizeFile(ext){
  const map={'🪪 证件类':['.pdf'],'📄 文档类':['.doc','.docx','.txt','.pages','.md'],'📊 表格类':['.xls','.xlsx','.csv','.numbers'],'🎵 音频类':['.mp3','.m4a','.wav','.aac'],'🎬 视频类':['.mp4','.mov','.avi','.mkv'],'💬 聊天记录':['.json','.html'],'🖼️ 图片类':['.jpg','.jpeg','.png','.heic','.webp'],'📦 压缩包':['.zip','.rar','.7z']};
  for(const[cat,exts]of Object.entries(map)){if(exts.includes(ext))return cat;}
  return null;
}
