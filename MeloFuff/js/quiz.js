/* MeloFuff — 20-question personality + voice test */

const QUIZ_TRAIT_KEYS = ['social', 'energy', 'texture', 'warmth', 'rhythm', 'curiosity', 'craft'];

const QUIZ_STEPS = [
  {
    kind: 'choice', cat: '生活方式',
    title: '周末醒来，你最想先做什么？',
    sub: '没有标准答案，跟着第一感觉走。',
    options: [
      { label: '出门去追一阵风', hint: '公园、海边，或者随便走走', traits: { social: 0.8, energy: 0.85, curiosity: 0.9 } },
      { label: '窝进被窝再赖十分钟', hint: '让软软的被子把人包住', traits: { social: 0.3, energy: 0.3, curiosity: 0.3, texture: 0.8 } },
    ],
  },
  {
    kind: 'choice', cat: '手作偏好',
    title: '如果今天做一件小手工，你会拿起……',
    sub: '',
    options: [
      { label: '一团毛线和羊毛毡', hint: '软乎乎、可以揉来揉去', traits: { craft: 0.9, texture: 0.9, energy: 0.5 } },
      { label: '丝带、亮片和透明糖纸', hint: '轻巧、会反光的小东西', traits: { craft: 0.7, texture: 0.2, energy: 0.6, warmth: 0.4 } },
    ],
  },
  {
    kind: 'choice', cat: '社交能量',
    title: '在热闹的聚会上，你通常会……',
    sub: '',
    options: [
      { label: '主动和新朋友打招呼', hint: '聊着聊着就认识了一圈人', traits: { social: 0.95, energy: 0.8 } },
      { label: '待在熟悉的人身边慢慢聊天', hint: '小圈子就是舒服的充电站', traits: { social: 0.2, energy: 0.4 } },
    ],
  },
  {
    kind: 'choice', cat: '日常审美',
    title: '下面两组糖果配色，你更想捧起哪一组？',
    sub: '',
    options: [
      { label: '草莓粉、蜜桃橘、蜂蜜黄', hint: '像刚出炉的甜点', traits: { warmth: 0.9, energy: 0.8 } },
      { label: '薄荷绿、海盐蓝、葡萄紫', hint: '像一杯加冰的汽水', traits: { warmth: 0.2, energy: 0.5, rhythm: 0.6 } },
    ],
  },
  {
    kind: 'choice', cat: '音乐口味',
    title: '耳机里循环最多的是……',
    sub: '',
    options: [
      { label: '轻快电子、City Pop', hint: '走路会忍不住跟着点头', traits: { rhythm: 0.9, energy: 0.8, social: 0.6 } },
      { label: '慢拍 R&B、氛围钢琴', hint: '适合一个人慢慢晃神', traits: { rhythm: 0.2, energy: 0.3, social: 0.4 } },
    ],
  },
  {
    kind: 'choice', cat: '甜食偏好',
    title: '面对一块甜品，你最先被什么打动？',
    sub: '',
    options: [
      { label: '蓬松、轻飘飘的空气感', hint: '像一朵可以吃的云', traits: { texture: 0.95, energy: 0.6 } },
      { label: '丝滑、会融化的酱心', hint: '温柔地从舌尖化开', traits: { texture: 0.2, rhythm: 0.4, warmth: 0.6 } },
    ],
  },
  {
    kind: 'choice', cat: '旅行方式',
    title: '如果明天出发，你更想去……',
    sub: '',
    options: [
      { label: '海边追浪，逛热闹的市集', hint: '人多一点才好玩', traits: { curiosity: 0.9, social: 0.8, energy: 0.85 } },
      { label: '山林小木屋，安静看云', hint: '远离人声，听风就好', traits: { curiosity: 0.4, social: 0.2, energy: 0.3, warmth: 0.6 } },
    ],
  },
  {
    kind: 'choice', cat: '情绪充电',
    title: '心情低落的时候，你会……',
    sub: '',
    options: [
      { label: '出门散步，让风把它吹散', hint: '走一走，世界就亮一点', traits: { curiosity: 0.8, energy: 0.7 } },
      { label: '抱紧毛毯，听一首很慢的歌', hint: '先让自己被软软地接住', traits: { texture: 0.85, rhythm: 0.2, energy: 0.3 } },
    ],
  },
  {
    kind: 'voice', voiceKey: 'poem', cat: '声音题 01 / 02', action: '朗读',
    title: '把这首小诗读给我听',
    subtitle: '用你平时的声音就好，不用刻意好听。',
    poem: ['春风拂过糖果山，', '铃铛摇落一肩甜。', '我把小小的心事，', '轻轻唱给云听见。'],
    maxSeconds: 20,
  },
  {
    kind: 'choice', cat: '记录方式',
    title: '拍照时，你更像……',
    sub: '',
    options: [
      { label: '拍下人群、笑脸和热闹现场', hint: '记住大家在一起的感觉', traits: { social: 0.9, energy: 0.8, curiosity: 0.6 } },
      { label: '拍光影、角落和一杯水的倒影', hint: '小细节里藏着今天', traits: { social: 0.2, craft: 0.7, warmth: 0.5 } },
    ],
  },
  {
    kind: 'choice', cat: '空间审美',
    title: '你的房间最不能缺少……',
    sub: '',
    options: [
      { label: '毛绒抱枕、软毯和暖色小灯', hint: '窝着就很安心', traits: { texture: 0.9, warmth: 0.8, energy: 0.3 } },
      { label: '干净的留白、一点金属或玻璃', hint: '清爽一点才待得住', traits: { texture: 0.2, warmth: 0.2, craft: 0.5 } },
    ],
  },
  {
    kind: 'choice', cat: '礼物偏好',
    title: '朋友送你礼物，你更希望是……',
    sub: '',
    options: [
      { label: '一张说走就走的旅行票', hint: '未知本身就很甜', traits: { curiosity: 0.9, energy: 0.8, social: 0.6 } },
      { label: '亲手做的小东西', hint: '有手心的温度', traits: { craft: 0.9, texture: 0.7, warmth: 0.7 } },
    ],
  },
  {
    kind: 'choice', cat: '色彩直觉',
    title: '第一眼选颜色，你会选……',
    sub: '',
    options: [
      { label: '草莓粉 / 蜜桃橘 / 柠檬黄', hint: '暖暖的、甜甜的、亮亮的', traits: { warmth: 0.95, energy: 0.8 } },
      { label: '薄荷绿 / 海盐蓝 / 葡萄紫', hint: '清清的、凉凉的、安静的', traits: { warmth: 0.15, energy: 0.4, rhythm: 0.6 } },
    ],
  },
  {
    kind: 'choice', cat: '走路节奏',
    title: '你走路时的节奏通常是……',
    sub: '',
    options: [
      { label: '轻快，偶尔带一点跳步', hint: '路边的花都想跟它打招呼', traits: { rhythm: 0.9, energy: 0.8 } },
      { label: '慢慢走，顺便把风景看完', hint: '不着急，今天又不赶路', traits: { rhythm: 0.2, energy: 0.3, curiosity: 0.5 } },
    ],
  },
  {
    kind: 'choice', cat: '材质手感',
    title: '挑一块布料做音绒仔，你会先摸……',
    sub: '',
    options: [
      { label: '毛茸茸、摸进去会陷下去的长毛', hint: '像抱住一朵小云', traits: { texture: 0.95, energy: 0.5, warmth: 0.7 } },
      { label: '滑滑凉凉、会泛一点光的丝绸', hint: '像一口凉凉的果冻', traits: { texture: 0.15, warmth: 0.3, rhythm: 0.5 } },
    ],
  },
  {
    kind: 'choice', cat: '他人印象',
    title: '朋友更常说你像……',
    sub: '',
    options: [
      { label: '热闹又明亮的小太阳', hint: '去哪里都能把气氛点亮', traits: { social: 0.9, energy: 0.9, warmth: 0.8 } },
      { label: '安静又细腻的月光', hint: '不说话的时候也在认真感受', traits: { social: 0.2, energy: 0.3, craft: 0.8, warmth: 0.5 } },
    ],
  },
  {
    kind: 'choice', cat: '独处计划',
    title: '一个人的周末，你更可能……',
    sub: '',
    options: [
      { label: '去逛展、探店、到处走走', hint: '说不定会遇见什么新鲜事', traits: { curiosity: 0.9, social: 0.6, energy: 0.7 } },
      { label: '在家做手工、整理收藏', hint: '把时间慢慢揉成喜欢的样子', traits: { craft: 0.9, texture: 0.6, social: 0.3 } },
    ],
  },
  {
    kind: 'voice', voiceKey: 'hum', cat: '声音题 02 / 02', action: '哼唱',
    title: '随便哼一段吧',
    subtitle: '不用歌词、不用唱准。30 秒里，想怎么唱都可以。',
    humPrompt: '哼一段今天的心情',
    maxSeconds: 30,
  },
  {
    kind: 'choice', cat: '睡前仪式',
    title: '睡前你更习惯……',
    sub: '',
    options: [
      { label: '听一会儿轻快的歌，让心情亮起来', hint: '用一点甜把今天收尾', traits: { rhythm: 0.8, energy: 0.7 } },
      { label: '听环境声或慢歌，把今天慢慢放下', hint: '安静地跟今天说晚安', traits: { rhythm: 0.2, energy: 0.2, texture: 0.5 } },
    ],
  },
  {
    kind: 'choice', cat: '此刻心情',
    title: '走进糖果丘陵时，你的心情更接近……',
    sub: '',
    options: [
      { label: '甜甜的，想马上出发', hint: '想要立刻跑起来', traits: { energy: 0.9, curiosity: 0.9 } },
      { label: '软软的，想慢慢逛', hint: '想先抱抱路上的小糖', traits: { energy: 0.3, texture: 0.9, warmth: 0.6 } },
    ],
  },
];

const QUIZ_PALETTES = [
  {
    id: 'strawberry', name: '草莓奶油', flavor: '草莓奶油', nickname: '莓莓软云',
    target: { warmth: 0.85, energy: 0.7, texture: 0.85, rhythm: 0.65, social: 0.6, curiosity: 0.65, craft: 0.5 },
    body: '#FFCCDA', light: '#FFF2F6', deep: '#E996AE', fur: '#F5B0C4',
    eye: '#4E2F3B', iris: '#F58BA8', irisLight: '#FFDCE6', irisDeep: '#C95679', pupil: '#432833',
    blush: '#FF9DB4', bow: '#A9E7D5', bowDeep: '#79CBB5', accent: '#FF7C9D', cream: '#FFF9EF',
    eyeName: '莓果粉星',
  },
  {
    id: 'peach', name: '蜜桃奶霜', flavor: '蜜桃', nickname: '桃桃呼噜',
    target: { warmth: 0.9, energy: 0.75, texture: 0.72, rhythm: 0.62, social: 0.7, curiosity: 0.65, craft: 0.5 },
    body: '#FFD8C7', light: '#FFF3EC', deep: '#F0B49B', fur: '#F7C8B4',
    eye: '#4E3531', iris: '#F2A07F', irisLight: '#FFE6D9', irisDeep: '#C97557', pupil: '#432B29',
    blush: '#FFA8A1', bow: '#FFE3A8', bowDeep: '#E9BE72', accent: '#FF8F7D', cream: '#FFF9EE',
    eyeName: '蜜桃橘光',
  },
  {
    id: 'mint', name: '薄荷可可', flavor: '薄荷', nickname: '薄荷啵啵',
    target: { warmth: 0.3, energy: 0.5, texture: 0.9, rhythm: 0.45, social: 0.5, curiosity: 0.5, craft: 0.75 },
    body: '#C6EAD9', light: '#F1FCF7', deep: '#93CEB7', fur: '#AEE3CE',
    eye: '#405148', iris: '#75C9A8', irisLight: '#DAF8EA', irisDeep: '#44987C', pupil: '#35463D',
    blush: '#FFB1C0', bow: '#FFD6A5', bowDeep: '#EFB36C', accent: '#67C29F', cream: '#FFF9ED',
    eyeName: '薄荷翡翠',
  },
  {
    id: 'soda', name: '海盐苏打', flavor: '海盐', nickname: '盐盐星',
    target: { warmth: 0.2, energy: 0.65, texture: 0.3, rhythm: 0.8, social: 0.55, curiosity: 0.75, craft: 0.35 },
    body: '#CCE3FF', light: '#F0F8FF', deep: '#9DC3EA', fur: '#B7D6F5',
    eye: '#3F4A64', iris: '#7FB4E8', irisLight: '#DDF0FF', irisDeep: '#4D7FB4', pupil: '#354059',
    blush: '#FFAFBE', bow: '#FFE0A8', bowDeep: '#EDC174', accent: '#78AEE4', cream: '#FFFBF0',
    eyeName: '海盐星光',
  },
  {
    id: 'grape', name: '葡萄软糖', flavor: '葡萄', nickname: '葡萄晚安',
    target: { warmth: 0.4, energy: 0.35, texture: 0.75, rhythm: 0.35, social: 0.4, curiosity: 0.5, craft: 0.7 },
    body: '#E1CCF7', light: '#F8F1FF', deep: '#C0A0E4', fur: '#D4BAF0',
    eye: '#503C56', iris: '#AF86DF', irisLight: '#EFE1FF', irisDeep: '#7F56AF', pupil: '#432F4B',
    blush: '#FFA9C9', bow: '#FFE2A8', bowDeep: '#EEC17A', accent: '#B58AE0', cream: '#FFF9F0',
    eyeName: '葡萄晚星',
  },
  {
    id: 'lemon', name: '柠檬汽水', flavor: '柠檬', nickname: '柠柠跳跳',
    target: { warmth: 0.75, energy: 0.85, texture: 0.5, rhythm: 0.8, social: 0.7, curiosity: 0.8, craft: 0.4 },
    body: '#FFEBB0', light: '#FFF9E0', deep: '#EBCB78', fur: '#F5D88D',
    eye: '#4E422E', iris: '#DDB35C', irisLight: '#FFF4C9', irisDeep: '#A97E35', pupil: '#403526',
    blush: '#FFB59C', bow: '#FFB7CC', bowDeep: '#EE8CA9', accent: '#F2C14E', cream: '#FFFBF0',
    eyeName: '柠檬蜜光',
  },
  {
    id: 'sakura', name: '樱花月光', flavor: '樱花', nickname: '樱樱月',
    target: { warmth: 0.55, energy: 0.25, texture: 0.65, rhythm: 0.3, social: 0.25, curiosity: 0.4, craft: 0.8 },
    body: '#F7D6E4', light: '#FFF4F8', deep: '#E3AFC5', fur: '#EFC3D5',
    eye: '#4F3744', iris: '#D9A0BD', irisLight: '#FCEDF4', irisDeep: '#A96B8A', pupil: '#44303A',
    blush: '#F7A9BB', bow: '#D7C4F4', bowDeep: '#B49BDE', accent: '#E48FAF', cream: '#FFF9F3',
    eyeName: '樱色月晕',
  },
  {
    id: 'cocoa', name: '可可云朵', flavor: '可可', nickname: '可可呼呼',
    target: { warmth: 0.6, energy: 0.4, texture: 0.85, rhythm: 0.4, social: 0.45, curiosity: 0.45, craft: 0.65 },
    body: '#E8CBBF', light: '#FBF1EB', deep: '#C9A18F', fur: '#D8B5A6',
    eye: '#49352F', iris: '#C98E6C', irisLight: '#F7E2D2', irisDeep: '#906047', pupil: '#3E2B25',
    blush: '#F3A996', bow: '#FFF0C8', bowDeep: '#E8CB87', accent: '#C97F5E', cream: '#FFF9F2',
    eyeName: '可可琥珀',
  },
];

const QUIZ_MATERIALS = [
  { id: 'silk', name: '丝绸软糯', fuzzMul: 0.42, gloss: 0.4, target: { texture: 0.02, rhythm: 0.12 }, blurb: '像一段会慢慢融化的奶油' },
  { id: 'short', name: '短绒哑光', fuzzMul: 0.55, gloss: 0.1, target: { texture: 0.2, rhythm: 0.42 }, blurb: '像一颗安静发光的哑光糖' },
  { id: 'fleece', name: '摇粒绒', fuzzMul: 0.95, gloss: 0.18, target: { texture: 0.5, rhythm: 0.55 }, blurb: '像刚晒过太阳的小毯子' },
  { id: 'lamb', name: '羊羔绒', fuzzMul: 1.12, gloss: 0.2, target: { texture: 0.75, rhythm: 0.3 }, blurb: '像一团会呼吸的羊毛云' },
  { id: 'wool', name: '羊毛蓬松', fuzzMul: 1.35, gloss: 0.15, target: { texture: 0.92, rhythm: 0.72 }, blurb: '像一颗毛茸茸的棉花糖' },
];

const QUIZ_ARCHETYPES = [
  { name: '草莓色小太阳', test: (s) => s.energy * 0.42 + s.warmth * 0.3 + s.social * 0.28, desc: '最喜欢把热闹和甜味一起带在身边。' },
  { name: '软糯月光团', test: (s) => (1 - s.energy) * 0.4 + s.texture * 0.38 + (1 - s.social) * 0.22, desc: '慢一点也没关系，它会把每一颗小音符都接住。' },
  { name: '追风小探险家', test: (s) => s.curiosity * 0.5 + s.energy * 0.3 + (1 - s.craft) * 0.2, desc: '一听见远处有新关卡，耳朵就会先竖起来。' },
  { name: '手作甜心', test: (s) => s.craft * 0.5 + s.texture * 0.3 + s.warmth * 0.2, desc: '喜欢用手把日子慢慢捏成喜欢的样子。' },
  { name: '独自摇摆的星星', test: (s) => s.rhythm * 0.46 + (1 - s.social) * 0.3 + s.curiosity * 0.24, desc: '有自己的小节奏，安静的时候也在发光。' },
  { name: '温柔声线梦游者', test: (s) => (1 - s.rhythm) * 0.4 + (1 - s.energy) * 0.3 + s.texture * 0.3, desc: '会把一首歌听到很晚，再轻轻哼给云听。' },
];

function quizClamp(v, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}

function quizVoiceSummary(voice) {
  const recs = [voice && voice.poem, voice && voice.hum].filter(Boolean);
  if (!recs.length) return null;
  const energy = recs.reduce((s, r) => s + r.energy, 0) / recs.length;
  const variance = recs.reduce((s, r) => s + r.varianceNorm, 0) / recs.length;
  const voiced = recs.reduce((s, r) => s + r.voicedRatio, 0) / recs.length;
  const fluffiness = quizClamp(energy * 0.55 + variance * 0.45);
  const bounce = quizClamp(energy * 0.5 + variance * 0.5);
  let label = '清亮的糖果声线';
  if (energy > 0.55 && variance > 0.4) label = '轻盈跳跃的声线';
  else if (energy < 0.35 && variance < 0.35) label = '丝绸一样软的声线';
  else if (variance < 0.25) label = '温柔的低声';
  else if (voiced < 0.25) label = '轻轻的气声';
  return { energy, variance, voiced, fluffiness, bounce, label, count: recs.length };
}

function quizComputeScores(answers, voice) {
  const sums = {};
  const counts = {};
  QUIZ_TRAIT_KEYS.forEach((k) => { sums[k] = 0; counts[k] = 0; });
  for (let i = 0; i < QUIZ_STEPS.length; i++) {
    const step = QUIZ_STEPS[i];
    if (step.kind !== 'choice') continue;
    const pick = answers[i];
    if (pick === undefined || pick === null) continue;
    const traits = step.options[pick] && step.options[pick].traits;
    if (!traits) continue;
    for (const k of Object.keys(traits)) {
      if (!(k in sums)) continue;
      sums[k] += traits[k];
      counts[k] += 1;
    }
  }
  const vs = quizVoiceSummary(voice);
  if (vs) {
    sums.energy += vs.energy; counts.energy += 1;
    sums.texture += vs.fluffiness; counts.texture += 1;
    sums.rhythm += vs.bounce; counts.rhythm += 1;
  }
  const scores = {};
  for (const k of QUIZ_TRAIT_KEYS) scores[k] = counts[k] ? quizClamp(sums[k] / counts[k]) : 0.5;
  return scores;
}

function quizChoosePalette(scores) {
  let best = QUIZ_PALETTES[0];
  let bestD = Infinity;
  for (const p of QUIZ_PALETTES) {
    let d = 0;
    for (const k of QUIZ_TRAIT_KEYS) {
      const w = k === 'warmth' || k === 'energy' || k === 'texture' ? 1.2 : 0.9;
      d += w * Math.pow((p.target[k] ?? 0.5) - scores[k], 2);
    }
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function quizChooseMaterial(scores) {
  let best = QUIZ_MATERIALS[0];
  let bestD = Infinity;
  for (const m of QUIZ_MATERIALS) {
    const d = Math.pow(m.target.texture - scores.texture, 2) * 1.6 + Math.pow(m.target.rhythm - scores.rhythm, 2);
    if (d < bestD) { bestD = d; best = m; }
  }
  return best;
}

function quizChooseArchetype(scores) {
  let best = QUIZ_ARCHETYPES[0];
  let bestS = -Infinity;
  for (const a of QUIZ_ARCHETYPES) {
    const s = a.test(scores);
    if (s > bestS) { bestS = s; best = a; }
  }
  return best;
}

function quizGenerateResult(answers, voice) {
  const scores = quizComputeScores(answers, voice);
  const palette = quizChoosePalette(scores);
  const material = quizChooseMaterial(scores);
  const archetype = quizChooseArchetype(scores);
  const vs = quizVoiceSummary(voice);
  const voiceLabel = vs ? vs.label : '默认小奶音';
  const shine = quizClamp(0.9 + scores.energy * 0.22 + (vs ? 0.04 : 0), 0.88, 1.2);
  const description = `${palette.nickname} 是从一颗${palette.flavor}心里长出来的音绒仔。${material.blurb}。${archetype.desc}`;
  const theme = {
    name: palette.nickname,
    material: material.name,
    fuzzMul: material.fuzzMul,
    gloss: material.gloss,
    shine,
    body: palette.body,
    light: palette.light,
    deep: palette.deep,
    fur: palette.fur,
    eye: palette.eye,
    iris: palette.iris,
    irisLight: palette.irisLight,
    irisDeep: palette.irisDeep,
    pupil: palette.pupil,
    blush: palette.blush,
    bow: palette.bow,
    bowDeep: palette.bowDeep,
    accent: palette.accent,
    cream: palette.cream,
    swatch: [palette.body, palette.accent, palette.bow],
    custom: true,
    paletteName: palette.name,
    personality: archetype.name,
    eyeName: palette.eyeName,
    voiceLabel,
    description,
  };
  return { scores, palette, material, archetype, theme, voiceSummary: vs, voiceLabel };
}

/* =========================================================
   The quiz screen
   ========================================================= */

class QuizScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.mode = 'intro';
    this.index = 0;
    this.answers = new Array(QUIZ_STEPS.length).fill(null);
    this.voice = { poem: null, hum: null };
    this.result = null;
    this.recState = 'idle';
    this.recorder = null;
    this.recError = '';
    this.recPending = false;
    this.micRequestId = 0;
    this.waveHistory = [];
    this.resultT = 0;
    this.anim = 0;
    this.hit = {};
    this.sparkles = [];
    const rng = U.mulberry32(20261111);
    for (let i = 0; i < 26; i++) {
      this.sparkles.push({
        x: rng() * U.W, y: rng() * U.H,
        size: 1 + rng() * 2.4, phase: rng() * U.TAU,
        speed: 0.15 + rng() * 0.35,
      });
    }
  }

  get step() { return QUIZ_STEPS[this.index] || null; }

  startTest() {
    this.mode = 'question';
    this.index = 0;
    this.anim = 1;
    this.game.audio.sfx('ui');
    this.syncMode();
  }

  syncMode() {
    const step = this.step;
    if (!step) { this.finish(); return; }
    this.mode = step.kind === 'voice' ? 'voice' : 'question';
    if (step.kind === 'voice') {
      this.recState = this.voice[step.voiceKey] ? 'done' : 'idle';
      this.recError = '';
      this.recPending = false;
      this.waveHistory = [];
    }
  }

  next() {
    this.index += 1;
    this.anim = 1;
    if (this.index >= QUIZ_STEPS.length) this.finish();
    else this.syncMode();
  }

  back() {
    this.micRequestId++;
    if (this.recorder) this.stopRecorder(false);
    if (this.index <= 0) {
      this.game.goTitle();
      return;
    }
    this.index -= 1;
    this.anim = 1;
    this.syncMode();
    this.game.audio.sfx('ui');
  }

  choose(pick) {
    const step = this.step;
    if (!step || step.kind !== 'choice') return;
    if (pick < 0 || pick >= step.options.length) return;
    this.answers[this.index] = pick;
    this.game.audio.sfx('ui');
    this.game.burst(640, step.options.length === 2 ? (pick === 0 ? 415 : 515) : 460, 8, {
      sparkle: true, spread: 100, speed: 120, life: 0.45,
      color: pick === 0 ? this.game.character.theme.accent : this.game.character.theme.bow,
    });
    this.next();
  }

  finish() {
    this.result = quizGenerateResult(this.answers, this.voice);
    this.game.setThemeData(this.result.theme);
    this.mode = 'result';
    this.resultT = 0;
    this.anim = 1;
    this.game.audio.sfx('milestone');
    this.game.burst(330, 430, 26, { sparkle: true, hearts: true, spread: 180, speed: 190, life: 1.2, color: this.result.theme.accent });
  }

  resetTest() {
    if (this.recorder) this.stopRecorder(false);
    this.mode = 'intro';
    this.index = 0;
    this.answers.fill(null);
    this.voice = { poem: null, hum: null };
    this.result = null;
    this.recState = 'idle';
    this.recError = '';
    this.recPending = false;
    this.anim = 1;
    this.resultT = 0;
  }

  isInteractive() { return true; }

  /* ---------- recording ---------- */

  async startRecording() {
    const step = this.step;
    if (!step || step.kind !== 'voice' || this.recPending || this.recState === 'recording') return;
    this.recError = '';
    this.recPending = true;
    this.recState = 'pending';
    this.game.audio.sfx('ui');
    const req = ++this.micRequestId;
    let stream = null;
    let ctx = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-mic');
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (req !== this.micRequestId || this.mode !== 'voice' || this.step !== step) {
        try { stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* ignore */ }
        this.recPending = false;
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('no-audio-context');
      ctx = new AC();
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.72;
      src.connect(analyser);
      this.recorder = {
        stream, ctx, analyser,
        buf: new Float32Array(analyser.fftSize),
        samples: [],
        started: performance.now(),
        lastSample: 0,
        max: step.maxSeconds || 30,
        key: step.voiceKey,
        elapsed: 0,
      };
      this.recState = 'recording';
      this.waveHistory = [];
      this.recPending = false;
      this.game.audio.sfx('ui');
    } catch (e) {
      try { if (stream) stream.getTracks().forEach((t) => t.stop()); } catch (err) { /* ignore */ }
      try { if (ctx) ctx.close(); } catch (err) { /* ignore */ }
      if (req !== this.micRequestId) { this.recPending = false; return; }
      this.recPending = false;
      this.recorder = null;
      this.recState = 'error';
      this.recError = '麦克风没有打开，也可以使用默认声线继续。';
      this.game.audio.sfx('bump');
    }
  }

  sampleRecorder() {
    const r = this.recorder;
    if (!r) return;
    const now = performance.now();
    r.elapsed = (now - r.started) / 1000;
    if (now - r.lastSample >= 95) {
      r.lastSample = now;
      r.analyser.getFloatTimeDomainData(r.buf);
      const buf = r.buf;
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      let mute = 0;
      for (let i = 0; i < buf.length; i++) mute += buf[i];
      mute /= buf.length;
      let zero = 0;
      for (let i = 0; i < buf.length; i++) if (buf[i] - mute > 0) zero++;
      const pitch = this.detectPitch(buf, r.ctx.sampleRate, mute);
      r.samples.push({ rms: Math.max(0, rms - 0.003), pitch });
      this.waveHistory.push(rms);
      while (this.waveHistory.length > 72) this.waveHistory.shift();
    }
    if (r.elapsed >= r.max) this.stopRecorder(true);
  }

  detectPitch(buf, sr, mean) {
    const n = buf.length;
    let rms = 0;
    for (let i = 0; i < n; i += 2) {
      const v = buf[i] - mean;
      rms += v * v;
    }
    rms = Math.sqrt(rms / (n / 2));
    if (rms < 0.012) return 0;
    const minLag = Math.max(20, Math.floor(sr / 700));
    const maxLag = Math.min(n - 4, Math.floor(sr / 80));
    let bestLag = -1;
    let bestCorr = 0;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      let corr = 0;
      let e1 = 0;
      let e2 = 0;
      for (let i = 0; i < n - lag; i += 4) {
        const a = buf[i] - mean;
        const b = buf[i + lag] - mean;
        corr += a * b;
        e1 += a * a;
        e2 += b * b;
      }
      if (e1 < 1e-5 || e2 < 1e-5) continue;
      const norm = corr / Math.sqrt(e1 * e2);
      if (norm > bestCorr) { bestCorr = norm; bestLag = lag; }
    }
    if (bestCorr < 0.45 || bestLag < 0) return 0;
    return sr / bestLag;
  }

  stopRecorder(save) {
    const r = this.recorder;
    if (!r) {
      if (this.recState === 'recording') this.recState = 'idle';
      return null;
    }
    try { r.stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* ignore */ }
    try { r.ctx.close(); } catch (e) { /* ignore */ }
    this.recorder = null;
    let metrics = null;
    if (save) {
      const energies = r.samples.map((s) => s.rms);
      const pitches = r.samples.filter((s) => s.pitch > 0).map((s) => s.pitch);
      const avgRms = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;
      const semis = pitches.map((p) => 12 * Math.log2(p / 220));
      let variance = 0;
      if (semis.length > 2) {
        const mean = semis.reduce((a, b) => a + b, 0) / semis.length;
        variance = Math.sqrt(semis.reduce((a, b) => a + (b - mean) * (b - mean), 0) / semis.length);
      }
      metrics = {
        energy: quizClamp((avgRms - 0.004) / 0.1),
        varianceNorm: quizClamp(variance / 5.5),
        pitchVar: variance,
        voicedRatio: r.samples.length ? pitches.length / r.samples.length : 0,
        duration: r.elapsed,
        key: r.key,
      };
      this.voice[r.key] = metrics;
    }
    this.recState = save ? 'done' : 'idle';
    this.game.audio.sfx(save ? 'milestone' : 'ui');
    return metrics;
  }

  continueVoice() {
    this.micRequestId++;
    if (this.recorder) this.stopRecorder(false);
    this.game.audio.sfx('ui');
    this.next();
  }

  skipVoice() {
    this.micRequestId++;
    if (this.recorder) this.stopRecorder(false);
    const step = this.step;
    if (step && step.voiceKey) this.voice[step.voiceKey] = null;
    this.game.audio.sfx('ui');
    this.next();
  }

  useDefaultVoice() {
    const step = this.step;
    if (step && step.voiceKey) this.voice[step.voiceKey] = null;
    this.game.audio.sfx('ui');
    this.next();
  }

  dispose() {
    this.micRequestId++;
    this.recPending = false;
    if (this.recorder) this.stopRecorder(false);
  }

  /* ---------- input ---------- */

  onPointer(px, py) {
    const h = this.hit;
    if (this.mode === 'intro') {
      if (h.start && U.pointInRect(px, py, h.start)) { this.startTest(); return; }
      if (h.back && U.pointInRect(px, py, h.back)) { this.game.goTitle(); return; }
      return;
    }
    if (this.mode === 'question') {
      if (h.options) {
        for (let i = 0; i < h.options.length; i++) {
          if (U.pointInRect(px, py, h.options[i])) { this.choose(i); return; }
        }
      }
      if (h.back && U.pointInRect(px, py, h.back)) { this.back(); return; }
      return;
    }
    if (this.mode === 'voice') {
      if (this.recState === 'recording') {
        if (h.stop && U.pointInRect(px, py, h.stop)) { this.stopRecorder(true); return; }
        if (h.skip && U.pointInRect(px, py, h.skip)) { this.skipVoice(); return; }
        if (h.back && U.pointInRect(px, py, h.back)) { this.stopRecorder(false); this.back(); return; }
        return;
      }
      if (h.mic && U.pointInRect(px, py, h.mic)) {
        if (this.recState === 'done') this.continueVoice();
        else if (this.recState === 'error') this.useDefaultVoice();
        else this.startRecording();
        return;
      }
      if (h.retry && U.pointInRect(px, py, h.retry)) { this.startRecording(); return; }
      if (h.skip && U.pointInRect(px, py, h.skip)) { this.skipVoice(); return; }
      if (h.back && U.pointInRect(px, py, h.back)) { this.back(); return; }
      return;
    }
    if (this.mode === 'result') {
      if (h.play && U.pointInRect(px, py, h.play)) { this.game.startRun(); return; }
      if (h.retry && U.pointInRect(px, py, h.retry)) { this.resetTest(); return; }
      if (h.back && U.pointInRect(px, py, h.back)) { this.game.goTitle(); return; }
    }
  }

  onKey(code, e) {
    if (code === 'Escape') { this.game.goTitle(); return; }
    if (this.mode === 'intro') {
      if (code === 'Space' || code === 'Enter') this.startTest();
      return;
    }
    if (this.mode === 'question') {
      if (code === 'Digit1' || code === 'Numpad1' || code === 'KeyA') this.choose(0);
      else if (code === 'Digit2' || code === 'Numpad2' || code === 'KeyB') this.choose(1);
      else if (code === 'ArrowLeft' || code === 'Backspace') this.back();
      return;
    }
    if (this.mode === 'voice') {
      if (this.recState === 'recording') {
        if (code === 'Space' || code === 'Enter') this.stopRecorder(true);
        return;
      }
      if (code === 'Space' || code === 'Enter') {
        if (this.recState === 'done') this.continueVoice();
        else if (this.recState === 'error') this.useDefaultVoice();
      } else if (code === 'ArrowLeft' || code === 'Backspace') {
        this.back();
      }
      return;
    }
    if (this.mode === 'result') {
      if (code === 'Space' || code === 'Enter') { this.game.startRun(); }
    }
  }

  /* ---------- update / draw ---------- */

  update(dt, pointer) {
    this.t += dt;
    this.anim = Math.max(0, this.anim - dt * 3.2);
    if (this.mode === 'voice' && this.recState === 'recording') this.sampleRecorder();
    if (this.mode === 'result') this.resultT += dt;
  }

  draw(ctx, pointer) {
    this.hit = {};
    this.drawBackground(ctx);
    this.drawCard(ctx);
    if (this.mode === 'intro') this.drawIntro(ctx, pointer);
    else if (this.mode === 'question') this.drawQuestion(ctx, pointer);
    else if (this.mode === 'voice') this.drawVoice(ctx, pointer);
    else if (this.mode === 'result') this.drawResult(ctx, pointer);
    this.drawSparkleField(ctx);
  }

  drawBackground(ctx) {
    const t = this.t;
    const camX = 500 + Math.sin(t * 0.05) * 30 + t * 3;
    const w = this.game.world;
    w.drawSky(ctx, t, camX);
    w.drawParallax(ctx, camX, t);
    const veil = ctx.createLinearGradient(0, 0, 0, U.H);
    veil.addColorStop(0, 'rgba(255,250,241,0.22)');
    veil.addColorStop(1, 'rgba(255,239,232,0.45)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, U.W, U.H);
    // soft floating candy notes
    for (let i = 0; i < 9; i++) {
      const a = t * 0.12 + i * 1.7;
      const x = 80 + ((i * 173 + t * 8) % 1180);
      const y = 90 + Math.sin(a) * 40 + (i % 3) * 150;
      U.drawNote(ctx, x, y, 16 + (i % 3) * 4, Math.sin(a) * 0.3, 'rgba(255,255,255,0.38)', 0.7);
    }
    const v = ctx.createRadialGradient(640, 360, 240, 640, 360, 760);
    v.addColorStop(0, 'rgba(255,248,236,0)');
    v.addColorStop(1, 'rgba(143,85,104,0.14)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, U.W, U.H);
  }

  drawCard(ctx) {
    const x = 120, y = 52, w = 1040, h = 616;
    this.card = { x, y, w, h };
    // soft shadow
    ctx.fillStyle = 'rgba(155,87,108,0.18)';
    U.roundRectPath(ctx, x, y + 10, w, h, 46);
    ctx.fill();
    U.roundRectPath(ctx, x, y, w, h, 46);
    const cg = ctx.createLinearGradient(0, y, 0, y + h);
    cg.addColorStop(0, 'rgba(255,252,246,0.97)');
    cg.addColorStop(1, 'rgba(255,246,239,0.96)');
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // candy-sprinkle strip
    ctx.save();
    U.roundRectPath(ctx, x + 26, y + 18, w - 52, 8, 4);
    const sg = ctx.createLinearGradient(x, 0, x + w, 0);
    sg.addColorStop(0, '#FFD4E0');
    sg.addColorStop(0.35, '#FFE6B2');
    sg.addColorStop(0.65, '#BDEBD9');
    sg.addColorStop(1, '#DCC8F5');
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();
    // header brand
    const brand = this.mode === 'result' ? 'MELOFUFF  ·  你的专属音绒仔' : 'MELOFUFF  ·  音绒仔人格小测';
    U.text(ctx, brand, x + 44, y + 48, {
      size: 12, family: U.FONT_ROUND, color: 'rgba(183,122,142,0.85)', letterSpacing: 2,
    });
  }

  drawProgress(ctx, step, number) {
    const c = this.card;
    const x = c.x + 44, y = c.y + 68, w = c.w - 88;
    ctx.fillStyle = 'rgba(237,203,214,0.5)';
    U.roundRectPath(ctx, x, y, w, 9, 4.5);
    ctx.fill();
    const p = quizClamp((number - 1) / QUIZ_STEPS.length);
    if (p > 0.002) {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#FFD1DF');
      g.addColorStop(0.6, '#FFB0C9');
      g.addColorStop(1, '#F78EAF');
      ctx.fillStyle = g;
      U.roundRectPath(ctx, x, y, Math.max(9, w * p), 9, 4.5);
      ctx.fill();
    }
    U.text(ctx, `${String(number).padStart(2, '0')} / ${QUIZ_STEPS.length}`, c.x + c.w - 44, y - 15, {
      size: 11, family: U.FONT_ROUND, color: 'rgba(181,120,139,0.8)', align: 'right', letterSpacing: 1,
    });
    // category chip
    if (step) {
      const label = step.cat;
      const width = Math.max(88, U.measure(ctx, label, 11, 400, U.FONT_UI) + 34);
      const cx = c.x + c.w - 44 - width;
      CandyUI.panel(ctx, cx, y + 18, width, 28, 14, {
        fill: 'rgba(255,247,244,0.85)', border: 'rgba(255,255,255,0.9)', shadow: false,
      });
      U.text(ctx, label, cx + width / 2, y + 32, {
        size: 11, color: 'rgba(165,111,128,0.85)', align: 'center',
      });
    }
  }

  drawIntro(ctx, pointer) {
    const c = this.card;
    const x = c.x + 70, y = c.y + 130;
    U.text(ctx, '找到你的音绒仔', x, y, {
      size: 48, family: U.FONT_DISPLAY, color: '#D17191',
      stroke: 'rgba(255,253,247,0.9)', strokeWidth: 8,
      shadow: 'rgba(177,89,116,0.16)', shadowBlur: 14, shadowY: 4,
    });
    U.text(ctx, '20 道小问题 + 2 段声音互动，大约 2 分钟。', x, y + 50, {
      size: 17, color: 'rgba(129,87,101,0.76)', letterSpacing: 0.3,
    });
    U.text(ctx, '没有标准答案。你只要跟着第一感觉，选那个更“像自己”的选项。', x, y + 82, {
      size: 13, color: 'rgba(160,116,130,0.68)',
    });

    // character stage
    const px = c.x + 225, py = c.y + 420;
    const glow = ctx.createRadialGradient(px, py - 30, 20, px, py - 30, 190);
    glow.addColorStop(0, 'rgba(255,252,240,0.8)');
    glow.addColorStop(1, 'rgba(255,235,242,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py - 30, 190, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(144,82,103,0.13)';
    ctx.beginPath();
    ctx.ellipse(px, py + 95, 92, 18, 0, 0, U.TAU);
    ctx.fill();
    this.game.character.draw(ctx, px, py - 8 + Math.sin(this.t * 2) * 3, 92, {
      time: this.t, phase: this.t * 2, grounded: true, expression: 'happy',
      aura: true, speedTier: 1, look: { x: 0.2, y: 0 },
    });

    // little info list
    const lx = c.x + 470, ly = c.y + 250;
    const items = [
      ['没有对错', '选更接近自己的那一个'],
      ['声音可选', '麦克风不方便时可以跳过'],
      ['只留在这台设备', '声音只在本机分析，不会上传'],
    ];
    for (let i = 0; i < items.length; i++) {
      const yy = ly + i * 64;
      ctx.fillStyle = ['rgba(255,188,205,0.55)', 'rgba(169,231,211,0.55)', 'rgba(220,200,246,0.55)'][i];
      ctx.beginPath();
      ctx.arc(lx + 16, yy - 4, 15, 0, U.TAU);
      ctx.fill();
      CandyUI.senseIcon(ctx, ['eye', 'ear', 'hand'][i], lx + 16, yy - 4, 8, ['#D97290', '#5FB394', '#9172C9'][i], 1);
      U.text(ctx, items[i][0], lx + 46, yy - 8, {
        size: 17, family: U.FONT_DISPLAY, color: '#8A5D6D',
      });
      U.text(ctx, items[i][1], lx + 46, yy + 16, {
        size: 12, color: 'rgba(153,110,124,0.7)',
      });
    }

    const start = { x: c.x + 470, y: c.y + 450, w: 290, h: 68 };
    const back = { x: c.x + 44, y: c.y + c.h - 62, w: 150, h: 40 };
    this.hit.start = start;
    this.hit.back = back;
    const hov = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, start);
    CandyUI.button(ctx, start, '开始 20 题', { hover: hov, primary: true, size: 30 });
    this.smallButton(ctx, back, '‹ 回到标题', pointer, false);
    U.text(ctx, '完成后会生成一只只属于你的音绒仔，并带它去闯关。', c.x + 470, c.y + 542, {
      size: 12, color: 'rgba(167,120,134,0.66)',
    });
  }

  drawQuestion(ctx, pointer) {
    const c = this.card;
    const step = this.step;
    const n = this.index + 1;
    this.drawProgress(ctx, step, n);

    const slide = this.anim * 12;
    ctx.save();
    ctx.globalAlpha = 1 - this.anim * 0.35;
    ctx.translate(0, slide);

    // question title, wrapped
    const maxW = 820;
    const lines = U.wrapText(ctx, step.title, maxW, 31, 400, U.FONT_DISPLAY);
    const startY = c.y + 150;
    for (let i = 0; i < lines.length; i++) {
      U.text(ctx, lines[i], c.x + c.w / 2, startY + i * 44, {
        size: 31, family: U.FONT_DISPLAY, color: '#8F5D6E', align: 'center',
      });
    }
    if (step.sub) {
      U.text(ctx, step.sub, c.x + c.w / 2, startY + lines.length * 44 + 12, {
        size: 13, color: 'rgba(158,113,127,0.65)', align: 'center',
      });
    }

    const options = step.options;
    this.hit.options = [];
    for (let i = 0; i < options.length; i++) {
      const oy = c.y + 302 + i * 92;
      const rect = { x: c.x + 72, y: oy, w: c.w - 144, h: 80 };
      this.hit.options.push(rect);
      this.optionButton(ctx, rect, options[i], i, this.answers[this.index] === i, pointer);
    }

    const back = { x: c.x + 44, y: c.y + c.h - 62, w: 120, h: 40 };
    this.hit.back = back;
    this.smallButton(ctx, back, '‹ 上一题', pointer, false);
    U.text(ctx, '按 1 / 2 选择  ·  ← 返回上一题', c.x + c.w - 44, c.y + c.h - 43, {
      size: 11, color: 'rgba(166,119,133,0.6)', align: 'right',
    });

    ctx.restore();
  }

  optionButton(ctx, r, option, i, selected, pointer) {
    const hov = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, r);
    const lift = hov ? -2 : 0;
    ctx.save();
    ctx.translate(0, lift);
    ctx.fillStyle = hov ? 'rgba(255,240,246,0.95)' : 'rgba(255,251,245,0.86)';
    U.roundRectPath(ctx, r.x, r.y, r.w, r.h, 24);
    ctx.fill();
    ctx.strokeStyle = selected ? '#FF9FBC' : hov ? 'rgba(255,186,205,0.9)' : 'rgba(255,216,226,0.75)';
    ctx.lineWidth = selected ? 2.5 : 1.7;
    ctx.stroke();
    // letter candy
    const col = i === 0 ? ['#FFD9E3', '#E7799A'] : ['#D7F2E7', '#58A98D'];
    const cx = r.x + 42, cy = r.y + r.h / 2;
    ctx.fillStyle = col[0];
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, U.TAU);
    ctx.fill();
    U.text(ctx, i === 0 ? 'A' : 'B', cx, cy + 1, {
      size: 18, family: U.FONT_ROUND, color: col[1], align: 'center',
    });
    U.text(ctx, option.label, r.x + 80, r.y + 29, {
      size: 20, family: U.FONT_DISPLAY, color: '#835666',
    });
    if (option.hint) {
      U.text(ctx, option.hint, r.x + 80, r.y + 55, {
        size: 12, color: 'rgba(157,113,126,0.68)',
      });
    }
    // arrow
    ctx.strokeStyle = hov ? '#E989A5' : 'rgba(202,151,165,0.55)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const ax = r.x + r.w - 36;
    ctx.beginPath();
    ctx.moveTo(ax - 5, cy - 7);
    ctx.lineTo(ax + 3, cy);
    ctx.lineTo(ax - 5, cy + 7);
    ctx.stroke();
    ctx.restore();
  }

  drawVoice(ctx, pointer) {
    const c = this.card;
    const step = this.step;
    const n = this.index + 1;
    this.drawProgress(ctx, step, n);
    const slide = this.anim * 12;
    ctx.save();
    ctx.globalAlpha = 1 - this.anim * 0.35;
    ctx.translate(0, slide);

    U.text(ctx, step.title, c.x + c.w / 2, c.y + 96, {
      size: 32, family: U.FONT_DISPLAY, color: '#8F5D6E', align: 'center',
    });
    U.text(ctx, step.subtitle, c.x + c.w / 2, c.y + 132, {
      size: 13, color: 'rgba(158,113,127,0.68)', align: 'center',
    });

    const box = { x: c.x + 280, y: c.y + 156, w: 480, h: 158 };
    ctx.save();
    ctx.fillStyle = 'rgba(255,250,241,0.78)';
    U.roundRectPath(ctx, box.x, box.y, box.w, box.h, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,201,216,0.65)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (step.poem) {
      for (let i = 0; i < step.poem.length; i++) {
        U.text(ctx, step.poem[i], c.x + c.w / 2, box.y + 32 + i * 35, {
          size: 24, family: U.FONT_DISPLAY, color: 'rgba(123,81,96,0.86)', align: 'center', letterSpacing: 2,
        });
      }
    } else {
      ctx.save();
      ctx.translate(c.x + c.w / 2, box.y + 66);
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 56);
      g.addColorStop(0, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, 'rgba(255,205,221,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, U.TAU);
      ctx.fill();
      U.drawNote(ctx, 0, 0, 46, Math.sin(this.t * 2) * 0.12, '#E989A6', 0.9);
      ctx.restore();
      U.text(ctx, step.humPrompt, c.x + c.w / 2, box.y + 128, {
        size: 23, family: U.FONT_DISPLAY, color: 'rgba(123,81,96,0.8)', align: 'center',
      });
    }
    ctx.restore();

    // waveform panel
    const wave = { x: c.x + 300, y: c.y + 326, w: 440, h: 62 };
    ctx.fillStyle = 'rgba(255,248,239,0.72)';
    U.roundRectPath(ctx, wave.x, wave.y, wave.w, wave.h, 20);
    ctx.fill();
    const mid = wave.y + wave.h / 2;
    ctx.strokeStyle = 'rgba(229,176,193,0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(wave.x + 18, mid);
    ctx.lineTo(wave.x + wave.w - 18, mid);
    ctx.stroke();
    const bars = this.waveHistory.length ? this.waveHistory : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const stepX = (wave.w - 36) / Math.max(1, bars.length - 1);
    ctx.strokeStyle = step.poem ? 'rgba(217,131,158,0.8)' : 'rgba(112,191,163,0.82)';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < bars.length; i++) {
      let v;
      if (this.recState === 'recording') v = bars[i];
      else if (this.recState === 'done' && this.waveHistory.length) v = Math.max(0.04, bars[i] * 0.55);
      else v = 0.085 + 0.05 * Math.sin(i * 0.62 + this.t * 2.2) + 0.025 * Math.sin(i * 1.7 - this.t * 1.4);
      const hh = Math.min(wave.h / 2 - 8, 3 + Math.max(0, v) * 210);
      const px = wave.x + 18 + i * stepX;
      ctx.moveTo(px, mid - hh);
      ctx.lineTo(px, mid + hh);
    }
    ctx.stroke();

    const timer = this.recorder
      ? (this.recorder.elapsed || 0)
      : (this.voice[step.voiceKey] ? this.voice[step.voiceKey].duration : 0);
    const maxT = step.maxSeconds || 30;
    U.text(ctx, this.recState === 'recording'
      ? `正在听 · ${Math.floor(timer)}s / ${maxT}s`
      : (this.recState === 'done' ? '声音罐子收好啦' : `最多 ${maxT} 秒 · 随时可以停`), c.x + c.w / 2, c.y + 408, {
      size: 12, color: 'rgba(164,115,130,0.78)', align: 'center', letterSpacing: 0.5,
    });
    if (this.recState === 'error') {
      U.text(ctx, this.recError, c.x + c.w / 2, c.y + 426, {
        size: 11, color: 'rgba(203,118,139,0.9)', align: 'center',
      });
    }

    // controls
    this.hit = {};
    const controlsY = c.y + 438;
    const mic = { x: c.x + 300, y: controlsY, w: 280, h: 56 };
    const retry = { x: c.x + 610, y: controlsY + 5, w: 130, h: 46 };
    const skip = { x: c.x + c.w - 220, y: c.y + c.h - 62, w: 170, h: 40 };
    const back = { x: c.x + 44, y: c.y + c.h - 62, w: 120, h: 40 };
    this.hit.skip = skip;
    this.hit.back = back;
    const hovMic = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, mic);

    if (this.recState === 'recording') {
      const stop = { x: c.x + c.w / 2 - 105, y: controlsY, w: 210, h: 56 };
      this.hit.stop = stop;
      CandyUI.button(ctx, stop, '完成录音', {
        hover: pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, stop),
        primary: true, size: 24, note: false,
      });
    } else if (this.recState === 'done') {
      this.hit.mic = mic;
      this.hit.retry = retry;
      CandyUI.button(ctx, mic, '带着声音继续', { hover: hovMic, primary: true, size: 23, note: true });
      this.smallButton(ctx, retry, '重新录', pointer, false);
    } else if (this.recState === 'error') {
      this.hit.mic = mic;
      this.hit.retry = retry;
      CandyUI.button(ctx, mic, '使用默认声线继续', { hover: hovMic, primary: true, size: 20, note: false });
      this.smallButton(ctx, retry, '再试一次', pointer, false);
    } else {
      this.hit.mic = mic;
      const micLabel = this.recPending ? '正在打开麦克风…' : (step.action ? `开始${step.action}` : '开始录音');
      CandyUI.button(ctx, mic, micLabel, {
        hover: hovMic, primary: true, size: 23, note: false,
      });
    }
    this.smallButton(ctx, back, '‹ 上一题', pointer, false);
    this.smallButton(ctx, skip, '跳过声音题', pointer, false);
    U.text(ctx, '声音只在这台设备上分析 · 不会上传', c.x + c.w / 2, c.y + 512, {
      size: 10.5, color: 'rgba(169,124,137,0.55)', align: 'center', letterSpacing: 0.4,
    });

    ctx.restore();
  }

  drawResult(ctx, pointer) {
    const c = this.card;
    const res = this.result;
    if (!res) return;
    this.drawResultConfetti(ctx);

    const appear = U.easeOutBack(U.clamp(this.resultT / 0.7, 0, 1));
    const px = c.x + 235, py = c.y + 390;
    const glow = ctx.createRadialGradient(px, py - 40, 20, px, py - 40, 230);
    glow.addColorStop(0, 'rgba(255,253,241,0.96)');
    glow.addColorStop(0.55, 'rgba(255,236,242,0.5)');
    glow.addColorStop(1, 'rgba(255,236,242,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py - 40, 230, 0, U.TAU);
    ctx.fill();
    // macaron stage
    ctx.fillStyle = 'rgba(148,83,103,0.13)';
    ctx.beginPath();
    ctx.ellipse(px, py + 127, 115, 18, 0, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = '#FFE6D6';
    U.roundRectPath(ctx, px - 110, py + 104, 220, 25, 13);
    ctx.fill();
    this.game.character.draw(ctx, px, py + Math.sin(this.t * 2) * 3, 118 * (0.88 + appear * 0.12), {
      time: this.t,
      phase: this.t * 2,
      grounded: true,
      expression: 'happy',
      look: { x: 0.2, y: 0 },
      aura: true,
      sparkle: true,
      speedTier: 1,
    });

    // text block
    const tx = c.x + 455;
    const ty = c.y + 150;
    U.text(ctx, '你的音绒仔', tx, ty, {
      size: 15, family: U.FONT_DISPLAY, color: 'rgba(176,112,132,0.8)', letterSpacing: 2,
    });
    U.text(ctx, res.theme.name, tx, ty + 45, {
      size: 40, family: U.FONT_DISPLAY, color: '#C96788',
      stroke: 'rgba(255,252,246,0.85)', strokeWidth: 6,
    });
    ctx.fillStyle = 'rgba(255,245,238,0.9)';
    U.roundRectPath(ctx, tx, ty + 66, 300, 30, 15);
    ctx.fill();
    U.text(ctx, res.archetype.name, tx + 16, ty + 82, {
      size: 14, family: U.FONT_DISPLAY, color: '#A76B7E',
    });

    const descLines = U.wrapText(ctx, res.theme.description, 470, 15, 400, U.FONT_UI);
    for (let i = 0; i < descLines.length; i++) {
      U.text(ctx, descLines[i], tx, ty + 124 + i * 25, {
        size: 15, color: 'rgba(118,81,94,0.84)', lineHeight: 25,
      });
    }
    const voiceLine = res.voiceSummary
      ? `声线：${res.voiceLabel} · 声音特征已收进它的眼睛里`
      : '声线：默认小奶音 · 下次可以再唱给它听';
    U.text(ctx, voiceLine, tx, ty + 124 + descLines.length * 25 + 14, {
      size: 11.5, color: 'rgba(175,120,136,0.7)',
    });

    // trait chips
    const chips = [
      ['材质', res.material.name],
      ['色彩', `${res.palette.name}`],
      ['眼睛', res.palette.eyeName],
      ['声线', res.voiceSummary ? res.voiceLabel : '默认小奶音'],
    ];
    const chipY = ty + 252;
    for (let i = 0; i < chips.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = tx + col * 240;
      const cy = chipY + row * 36;
      ctx.fillStyle = 'rgba(255,249,241,0.8)';
      U.roundRectPath(ctx, cx, cy, 224, 28, 14);
      ctx.fill();
      U.text(ctx, chips[i][0], cx + 14, cy + 14, {
        size: 10, family: U.FONT_ROUND, color: 'rgba(189,128,146,0.8)', letterSpacing: 1,
      });
      U.text(ctx, chips[i][1], cx + 58, cy + 14, {
        size: 12, color: 'rgba(127,88,101,0.9)',
      });
    }

    const play = { x: tx, y: c.y + c.h - 128, w: 240, h: 62 };
    const retry = { x: tx + 258, y: c.y + c.h - 122, w: 132, h: 50 };
    const back = { x: c.x + 44, y: c.y + c.h - 62, w: 130, h: 40 };
    this.hit.play = play;
    this.hit.retry = retry;
    this.hit.back = back;
    const hov = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, play);
    CandyUI.button(ctx, play, '带它去闯关', { hover: hov, primary: true, size: 27 });
    this.smallButton(ctx, retry, '重新测试', pointer, false);
    this.smallButton(ctx, back, '‹ 回到标题', pointer, false);
    U.text(ctx, '音绒仔会带着这次测试的颜色、材质和声线继续冒险。', c.x + 44, c.y + c.h - 90, {
      size: 11, color: 'rgba(168,121,135,0.6)',
    });
  }

  drawResultConfetti(ctx) {
    const c = this.card;
    for (let i = 0; i < 20; i++) {
      const a = this.t * 0.3 + i * 1.7;
      const x = c.x + 100 + ((i * 137 + this.t * 10) % (c.w - 200));
      const y = c.y + 100 + Math.sin(a) * 40 + (i % 4) * 100;
      U.drawSparkle(ctx, x, y, 3 + Math.sin(a * 1.3) * 2, i % 3 ? 'rgba(255,255,255,0.75)' : 'rgba(255,220,160,0.85)', a, 0.5);
    }
  }

  drawSparkleField(ctx) {
    for (const s of this.sparkles) {
      const tw = 0.25 + 0.5 * U.pulse(this.t * s.speed + s.phase);
      U.drawSparkle(ctx, s.x, s.y, s.size * 2.1, 'rgba(255,255,255,0.8)', s.phase, tw * 0.7);
    }
  }

  smallButton(ctx, r, label, pointer, primary) {
    const hov = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, r);
    ctx.save();
    ctx.fillStyle = hov ? 'rgba(255,255,255,0.95)' : 'rgba(255,250,242,0.7)';
    U.roundRectPath(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,211,222,0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    U.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, {
      size: r.h > 45 ? 13 : 12, family: U.FONT_UI, color: hov ? '#C16D89' : 'rgba(151,105,119,0.8)', align: 'center',
    });
    ctx.restore();
  }
}
