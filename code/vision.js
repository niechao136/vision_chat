//#region 处理输入

function main({query, product, mission, step}) {
  const PRODUCT = ['VisionSense', 'FaceMatch', 'SignageCMS']
  const MISSION = ['Developer-Space_Function', 'Developer-Tech_Knowledge', 'Manager-Use_Cases', 'User-Operation_Support', 'User-Contact_Trial']
  let new_step = '', new_product = '', new_mission = '', option = '', answer = {}
  if (String(query).startsWith('button:')) {
    const idx = String(query).indexOf(':')
    option = String(query).slice(idx + 1)
  }
  if (option === 'All') {
    new_step = 'product'
    new_product = product
    new_mission = mission
  }
  if (PRODUCT.includes(option)) {
    new_product = option
    new_step = !!mission ? 'finish' : 'mission'
    new_mission = mission
  }
  if (MISSION.includes(option)) {
    new_mission = option
    new_step = !!product ? 'finish' : 'product'
    new_product = product
  }
  if (new_step !== 'finish') {
    answer = {
      step: new_step,
      introduce: option === 'All',
      role: step === '' && new_step === 'mission',
    }
  }
  return {
    new_step,
    new_product,
    new_mission,
    answer,
  }
}

//#endregion
//#region 整合回答

function main({output}) {
  const answer = {
    summary: output,
  }
  return {
    answer,
  }
}

//#endregion
//#region 整合回答

//#endregion
