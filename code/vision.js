//#region 处理输入

function main({query, product, mission, step, question}) {
  const PRODUCT_DETAIL = {
    VisionSense: 'VisionSense: Smart Vision & AI Analytics',
    FaceMatch: 'FaceMatch: Identity Verification',
    SignageCMS: 'SignageCMS: Digital Content Display',
  }
  const MISSION_DETAIL = {
    'Developer-Specs_Function': 'Explore specification & key features',
    'Developer-Tech_Knowledge': 'Access technical documentation',
    'Manager-Use_Cases': 'Review industry applications & case studies',
    'User-Operation_Support': 'Request operational support & troubleshooting',
    'User-Contact_Trial': 'Get a free trial',
  }
  let new_step = '', new_product = '', new_mission = '', option = '', answer = {}
  let new_question = '', new_role = '', new_lang = ''
  if (String(query).startsWith('button:')) {
    const idx = String(query).indexOf(':')
    const str = String(query).slice(idx + 1)
    let obj
    try {
      obj = JSON.parse(str)
    } catch (e) {
      obj = {}
    }
    option = obj?.value ?? str
    new_lang = obj?.lang ?? 'en-US'
  }
  if (option === 'All') {
    new_step = 'product'
  }
  if (option === 'More') {
    new_step = 'product'
  }
  if (!!PRODUCT_DETAIL[option]) {
    new_product = option
    new_step = !!mission || !!question ? 'finish' : 'mission'
    new_mission = mission
    new_question = question + (!!question ? '\n' : '') + PRODUCT_DETAIL[option]
  }
  if (!!MISSION_DETAIL[option]) {
    new_mission = option
    new_step = 'finish'
    new_product = product
    new_question = question + (!!question ? '\n' : '') + MISSION_DETAIL[option]
  }
  if (new_step !== 'finish') {
    answer = {
      step: new_step,
      lang: new_lang,
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
    new_lang,
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
  const lang = String(obj?.['lang'] ?? '').startsWith('zh') ? 'zh-TW' : 'en-US'
  const search = obj?.['search'] ?? query
  let new_step, new_product = product, new_mission = mission, answer = {}, new_question = question
  let new_role = '', new_prompt = '', check = [], summary = ''
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
  if (!!is_follow_up && step === 'finish' && check.length > 0) {
    new_question = PRODUCT_DETAIL[product] + '\n' + search
    new_prompt = '# Conversation History\n' + JSON.stringify(history)
  } else {
    if (check.length === 0) {
      summary = 'chat_none'
      if (step === 'finish') {
        new_step = 'product'
      } else {
        new_step = step === '' ? 'product' : step
      }
    } else {
      new_question = question + (!!question ? '\n' : '') + search
    }
    if (new_step !== 'finish') {
      answer = {
        step: new_step,
        lang,
        summary,
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
    lang,
  }
}

//#endregion
//#region 筛选检索结果

function main({result, product}) {
  const filter = Array.from(result).filter(o => {
    const title = String(o?.title ?? '')
    if (title.startsWith('Technical Documentation') || title.startsWith('Product Page')) {
      return title.includes(product)
    }
    return true
  })
  return {
    filter,
  }
}

//#endregion
//#region 整合回答

function main({output, filter, step, question, history, product, lang}) {
  const file = Array.from(filter).map(o => o.title)
  const answer = {
    step,
    product,
    lang,
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

const obj = {
  sr_only: 'Object recognition helps identify patients and staff, reducing night patrol needs and covering staff shortages.',
  overview: 'Night shifts often have fewer staff. How can hospitals still keep patients safe? VisionSense provides AI-driven monitoring that identifies medical staff, patients, and visitors in real time.',
  sr_only_o: 'VisionSense’s object recognition helps distinguish patients and staff, easing night-shift shortages and automating safety alerts.',
  problem_summary: 'During night shifts, hospitals often operate with fewer medical staff. This reduced manpower makes it harder to supervise patients and monitor movement within wards. Without assistance from AI-based vision recognition systems, incidents such as patient wandering or unauthorized entry can go unnoticed, delaying intervention and increasing overall risk.',
  problem_note: [
    {
      title: 'Insufficient Night Staffing:',
      note: 'Limited personnel make continuous patrols and supervision difficult.'
    },
    {
      title: 'Patient Movement Risks:',
      note: 'Elderly or high-risk patients may leave their rooms unnoticed, leading to potential accidents.'
    },
    {
      title: 'Unauthorized Access:',
      note: 'Without automated detection, outsiders may enter restricted or sensitive areas after visiting hours.'
    },
  ],
  sr_only_p: 'Night-shift staffing shortages make continuous patrols difficult. With fewer medical personnel available, hospitals face supervision gaps that can delay response to patient movement or emergencies.',
  op_summary: 'Artificial intelligence creates new opportunities for hospitals facing limited night-shift staff. By combining object recognition and automated alerting, AI systems like <strong>VisionSense</strong> act as always-on assistants—detecting patient movement, identifying staff, and alerting nurses in real time. This reduces manual patrol frequency, enables faster response to unusual events, and helps maintain patient safety even when manpower is stretched thin.',
  sr_only_op: 'AI-powered vision systems extend night-shift coverage by continuously monitoring wards, recognizing patient movement, and sending instant alerts—reducing workload caused by limited manpower.',
  solution_summary: 'VisionSense combines multiple AI-powered functions to support hospitals during night shifts, ensuring safety even when staffing is limited:',
  solution_note: [
    {
      title: 'Panoramic Coverage:',
      note: '360° cameras eliminate blind spots across corridors and wards, providing continuous visibility.'
    },
    {
      title: 'Accurate Role Recognition:',
      note: 'Object recognition identifies patients, staff, and visitors through uniforms and movement patterns.'
    },
    {
      title: 'Instant Video Alerts:',
      note: 'When unusual movement or unauthorized access is detected, VisionSense initiates real-time alerts directly connecting to nurse stations through video call for immediate communication.'
    },
  ],
  sr_only_s: 'AI-based panoramic vision, object recognition, and instant alerts detect patient and staff activity in real time—reducing manual patrols and improving response speed during night shifts.',
  arch_summary: 'VisionSense operates through an on-edge AI workflow that links video sources, local inference, and instant hospital notifications:',
  arch_note: [
    {
      title: 'Video Input — IP / 360° Cameras:',
      note: 'Hospital IP cameras or 360° panoramic cameras deliver RTSP video streams from wards and corridors. Optional autonomous mobile robots can provide mobile video sources for extended coverage.'
    },
    {
      title: 'VisionSense Edge — Solution Ready Package:',
      note: 'Performs on-device AI inference on live video to detect patients, staff, unknown individuals, wandering behavior, and restricted-area access. It also handles API events for triggering actions.'
    },
    {
      title: 'API Integration:',
      note: 'Connects with nurse-call systems to automate verification and alert workflows. Events trigger instant notifications to nurse stations for broadcast alerts or live video calls, enabling fast visual confirmation and rapid response.'
    },
  ],
  arch_table: [
    ['Requirement Device', '<strong>VisionSense Edge</strong> – Core AI processing unit running vision AI for on-edge inference.<br/><strong>IP Camera</strong> – Existing hospital IP cameras streaming RTSP video.<br/><strong>API Integrations</strong> – Connects with HIS, access control, or nurse-call systems at the station in your scenario.<br/>'],
    ['Optional Device', '<strong>360° Panoramic Camera</strong> – For full-room or hallway-wide visibility.<br/><strong>Autonomous Mobile Robot</strong> – Provides mobile video coverage in large wards or during night shifts.<br/>'],
  ],
  arch_footer: 'This edge-driven design minimizes latency, strengthens data security, and ensures continuous operation even in restricted or offline hospital networks.',
  sr_only_a: 'VisionSense connects video inputs, on-edge AI inference, and clinical notifications. Cameras stream RTSP video to VisionSense Edge, which detects patients, staff, or unusual activity and sends alerts or video calls to nurse stations in real time.',
  int_summary: 'Beyond night-shift safety, VisionSense can be expanded with additional AI modules that enhance daily hospital operations, ensuring compliance, security, and precision in medical environments:',
  int_footer: 'These extensions demonstrate how VisionSense evolves from night-shift safety monitoring into a multi-purpose AI vision system—covering personnel compliance, restricted-area security, and precise surgical management.',
  int_table: [
    ['AI Module', 'Function', 'Benefit'],
    ['<strong>PPE & Medical Wearable Compliance</strong>', 'Detect and verify whether staff wear required masks, gloves, and gowns correctly', 'Supports infection control and ensures medical safety standards are met'],
    ['<strong>Unauthorized Access Detection</strong>', 'Identify and alert when unknown individuals enter restricted areas or wards', 'Prevents security breaches and enhances patient privacy protection'],
    ['<strong>Surgical Tool Recognition</strong>', 'Recognize and count surgical instruments before and after operations', 'Reduces manual inventory errors and improves surgical workflow traceability'],
  ],
  sr_only_i: 'VisionSense extends with AI modules for PPE compliance, unauthorized access detection, and surgical tool recognition—enhancing hospital safety, security, and operational accuracy.',
  faq: [
    {
      title: 'Can the system recognize medical staff and patients even when they are wearing a mask?',
      note: 'Yes. The algorithm supports partial facial feature extraction and can accurately identify individuals even with masks.',
    },
    {
      title: 'Can the recognition device operate accurately in hospital areas with dim or nighttime lighting?',
      note: 'Yes. Equipped with infrared imaging to ensure stable identification in patient rooms and night-shift environments.',
    },
    {
      title: 'When abnormal behaviors or unauthorized entries are detected in hospital areas, does the system trigger alerts for staff?',
      note: 'Yes. Instant alerts can be sent to mobile devices and can trigger external devices such as alarms or signal lights.',
    },
    {
      title: 'Can the recognition device detect medical staff or patient behaviors?',
      note: 'Yes. Supports behavior analysis such as patient prolonged inactivity, and unauthorized entry to restricted areas.',
    },
    {
      title: 'Where does the system originate from?',
      note: 'The entire system is designed and developed in Taiwan.',
    },
  ],
  sr_only_f: 'Common questions include privacy and detection accuracy.',
}
