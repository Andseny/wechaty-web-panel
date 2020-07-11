const superagent = require('superagent')
const { getFormatQuery, loadFile } = require('../lib/index')
const fs = require('fs')
const path = require('path')
const env = JSON.parse(fs.readFileSync(path.resolve('./env.json')))
const { apiKey, apiSecret } = env
const { AIBOTK, TXHOST } = require('./config')

/**
 * 封装get请求
 * @param {*} url 地址
 * @param {*} params 参数
 * @param {*} contentType 发送请求数据类型
 */
function get(url, params, contentType = 'application/x-www-form-urlencoded', authorization = '') {
  return new Promise((resolve, reject) => {
    superagent
      .get(url)
      .query(params)
      .set('Content-Type', contentType)
      .set('Authorization', authorization)
      .end((err, res) => {
        if (err) reject(err)
        resolve(res)
      })
  })
}

/**
 * 封装post请求
 * @param {*} url 地址
 * @param {*} params 参数
 * @param {*} contentType 发送请求数据类型
 * @param authorization
 */
function post(url, params, contentType = 'application/x-www-form-urlencoded', authorization = '') {
  return new Promise((resolve, reject) => {
    superagent
      .post(url)
      .send(params)
      .set('Content-Type', contentType)
      .set('Authorization', authorization)
      .end((err, res) => {
        if (err) reject(err)
        resolve(res)
      })
  })
}

function req(option) {
  if (!option) return
  if (option.method == 'POST') {
    return post(option.url, option.params, option.contentType, option.authorization)
  } else {
    return get(option.url, option.params, option.contentType, option.authorization)
  }
}

function txReq(option) {
  const config = loadFile.fetch(path.resolve('./wechat.config.json'))
  if (!option) return
  const params = {
    key: config.txApiKey,
    ...option.params,
  }
  if (option.method === 'POST') {
    return post(TXHOST + option.url, params, option.contentType)
  } else {
    return get(TXHOST + option.url, params, option.contentType)
  }
}

function aiBotReq(option) {
  if (!option) return
  if (!apiKey || !apiSecret) {
    console.warn('未设置apikey或apiSecret，请登录https://wechat.aibotk.com 获取后重试')
    return
  }
  let params = getFormatQuery(apiKey, apiSecret, option.params)
  console.log('sign', params.sign)
  if (option.method === 'POST') {
    return post(AIBOTK + option.url, params, option.contentType)
  } else {
    return get(AIBOTK + option.url, params, option.contentType)
  }
}

module.exports = {
  req,
  txReq,
  aiBotReq,
}
