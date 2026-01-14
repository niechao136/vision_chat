//#region 处理输入

function main({query, product, mission, step, question}) {
  const MISSION_MAP = {
    'Explore specification & key features': 'Developer-Specs_Function',
    'Access technical documentation': 'Developer-Tech_Knowledge',
    'Review industry applications & case studies': 'Manager-Use_Cases',
    'Request operational support & troubleshooting': 'User-Operation_Support',
    'Get a free trial': 'User-Contact_Trial',
  }
  const PRODUCT_DETAIL = {
    VisionSense: 'VisionSense: Smart Vision & AI Analytics',
    FaceMatch: 'FaceMatch: Identity Verification',
    SignageCMS: 'SignageCMS: Digital Content Display',
  }
  let new_step = '', new_product = '', new_mission = '', option = '', answer = {}
  let new_question = '', new_role = ''
  if (String(query).startsWith('button:')) {
    const idx = String(query).indexOf(':')
    option = String(query).slice(idx + 1)
  }
  if (option === 'All') {
    new_step = 'product'
  }
  if (option === 'More Specific Information') {
    new_step = 'product'
  }
  if (!!PRODUCT_DETAIL[option]) {
    new_product = option
    new_step = 'mission'
    new_mission = mission
    new_question = question + (!!question ? '\n' : '') + PRODUCT_DETAIL[option]
  }
  if (!!MISSION_MAP[option]) {
    new_mission = MISSION_MAP[option]
    new_step = 'finish'
    new_product = product
    new_question = question + (!!question ? '\n' : '') + option
  }
  if (option.startsWith('As a')) {
    if (option.startsWith('As a developer')) {
      new_role = 'Developer'
    }
    if (option.startsWith('As a manager')) {
      new_role = 'Manager'
    }
    if (option.startsWith('As a user')) {
      new_role = 'User'
    }
    new_step = 'finish'
    new_product = product
    new_question = question + (!!question ? '\n' : '') + option
  }
  if (new_step !== 'finish') {
    answer = {
      step: new_step,
      product: new_product,
      mission: new_mission,
      introduce: option === 'All',
      role: step === '' && new_step === 'mission',
    }
  }
  return {
    new_step,
    new_product,
    new_mission,
    new_question,
    new_role,
    answer,
  }
}

//#endregion
//#region 处理解析结果

function handleLLM(text) {
  const regex = /```json([\s\S]*?)```/
  const _res = text.replaceAll(/<think>[\s\S]*?<\/think>/g, '')
  const match = _res.match(regex)
  const res = match ? match[1].trim() : _res
  // 更安全的注释移除，不会误删 URL 与字符串内容
  const str = res
    .replace(/\/\/(?!\s*http)[^\n]*/g, '')       // 去掉行注释，但保留 https://
    .replace(/\/\*[\s\S]*?\*\//g, '');           // 块注释
  let obj
  try {
    obj = JSON.parse(str)
  } catch (e) {
    obj = {}
  }
  return obj
}
function main({text, product, mission, question, query, step, history}) {
  const MISSION = ['Developer-Specs_Function', 'Developer-Tech_Knowledge', 'Manager-Use_Cases', 'User-Operation_Support', 'User-Contact_Trial']
  const PRODUCT_DETAIL = {
    VisionSense: 'VisionSense: Smart Vision & AI Analytics',
    FaceMatch: 'FaceMatch: Identity Verification',
    SignageCMS: 'SignageCMS: Digital Content Display',
  }
  const obj = handleLLM(text)
  const is_follow_up = !!obj?.['is_follow_up']
  let new_step, check = [], new_product = product, new_mission = mission, answer = {}, new_question = question
  let new_role = '', new_prompt = ''
  if (!is_follow_up && step === 'finish') {
    new_product = ''
    new_mission = ''
  }
  if (!!PRODUCT_DETAIL[obj?.['product']]) {
    new_product = obj?.['product']
    check.push('product')
  }
  if (MISSION.includes(obj?.['mission'])) {
    new_mission = obj?.['mission']
    check.push('mission')
  }
  new_step = !!new_product ? 'finish' : 'product'
  if (!!is_follow_up && step === 'finish') {
    new_question = (!check.includes('product') ? PRODUCT_DETAIL[product] + '\n' : '') + query
    new_prompt = '# Conversation History\n' + JSON.stringify(history)
  } else {
    if (check.length > 0) {
      new_question = question + (!!question ? '\n' : '') + query
    }
    if (new_step !== 'finish') {
      answer = {
        step: new_step,
        product: new_product,
        mission: new_mission,
      }
    } else {
      if (new_mission.startsWith('Developer')) {
        new_role = 'Developer'
      }
      if (new_mission.startsWith('Manager')) {
        new_role = 'Manager'
      }
      if (new_mission.startsWith('User')) {
        new_role = 'User'
      }
      if (!new_role) {
        const user_role = obj?.['user_role']
        new_role = ['Developer', 'Manager', 'User'].includes(user_role) ? user_role : 'User'
      }
    }
  }
  return {
    new_step,
    new_product,
    new_mission,
    new_question,
    new_role,
    new_prompt,
    answer,
  }
}

//#endregion
//#region 整合回答

function main({output, result, step, question, history, product}) {
  const file = Array.from(result).map(o => o.title)
  const answer = {
    step,
    product,
    summary: output,
    file: Array.from(new Set(file)),
  }
  const new_history = Array.from(history).concat([`question: ${question}\nanswer: ${output}`])
  return {
    answer,
    new_history,
  }
}

//#endregion
//#region 整合回答

//#endregion
