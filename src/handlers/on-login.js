const { setLocalSchedule, delay, putb64, loadFile } = require('../lib')
const { getConfig, getScheduleList, updateSchedule, sendAvatar, putqn, sendError } = require('../proxy/aibotk')
const { addUser, getUser } = require('../common/userDb')
const { allConfig } = require('../common/configDb')
const common = require('../common/index')
const path = require('path')
const { FileBox } = require('wechaty')

/**
 * 群定时任务，针对群
 * @param {*} that bot对象
 * @param {*} item 任务项
 */
async function setRoomTask(that, item) {
  try {
    let time = item.date
    let room = await that.Room.find({ topic: item.roomName })
    if (!room) {
      console.log(`查找不到群：${item.roomName}，请检查群名是否正确`)
      return
    } else {
      console.log(`群：“${item.roomName}”设置定时任务成功`)
      setLocalSchedule(time, async () => {
        if (item.contentType == 1) {
          let content = item.content
          console.log('群定时任务开始发送，内容：', content)
          await room.say(content)
        } else if (item.contentType == 2) {
          const fileBox2 = FileBox.fromFile(path.resolve(__dirname, item.content))
          console.log('群定时任务开始发送文件，文件')
          await room.say(fileBox2)
        }
      })
    }
  } catch (error) {
    console.log('设置群定时任务失败：', error)
  }
}

/**
 * 每日新闻资讯，针对群
 * @param {*} that bot对象
 * @param {*} item 任务项
 */
async function setEveryDayRoomSayTask(that, item) {
  try {
    let time = item.date
    let room = await that.Room.find({ topic: item.roomName })
    if (!room) {
      console.log(`查找不到群：${item.roomName}，请检查群名是否正确`)
      return
    } else {
      console.log(`群：“${item.roomName}”设置资讯任务成功`)
      setLocalSchedule(time, async () => {
        let content = await common.getEveryDayRoomContent(item.sortId, item.endWord)
        console.log('新闻咨询开始发送，内容：', content)
        await delay(10000)
        await room.say(content)
      })
    }
  } catch (error) {
    console.log('设置群资讯定时任务失败：', error)
  }
}

/**
 * 每日说定时任务设定，针对好友
 * @param {*} that bot对象
 * @param {*} item 任务项
 */
async function setEveryDayTask(that, item) {
  try {
    let time = item.date
    let contact = (await that.Contact.find({ alias: item.alias })) || (await that.Contact.find({ name: item.name })) // 获取你要发送的联系人
    if (!contact) {
      console.log(`查找不到用户昵称为'${item.name}'或备注为'${item.alias}'的用户，请检查设置用户是否正确`)
      return
    } else {
      console.log(`设置用户：“${item.name}|${item.alias}”每日说任务成功`)
      console.log(item)
      setLocalSchedule(time, async () => {
        let content = await common.getEveryDayContent(item.memorialDay, item.city, item.endWord)
        console.log('每日说任务开始工作,发送内容：', content)
        await delay(10000)
        await contact.say(content)
      })
    }
  } catch (error) {
    console.log('每日说任务设置失败')
  }
}

/**
 * 设置定时任务
 * @param {*} that bot 对象
 * @param {*} item 定时任务项
 */
async function setScheduleTask(that, item) {
  let time = item.isLoop ? item.time : new Date(item.time)
  setLocalSchedule(time, async () => {
    try {
      let contact = await that.Contact.find({ name: item.subscribe })
      console.log(`${item.subscribe}的专属提醒开启啦！`)
      await contact.say(item.content)
      if (!item.isLoop) {
        await updateSchedule(item.id)
      }
    } catch (error) {
      console.log('设置定时任务错误', error)
    }
  })
}

/**
 * 初始化小助手任务
 * @param {*} that bot对象
 * @param {*} scheduleList 提醒任务列表
 * @param {*} daySayList 每日说任务列表
 * @param {*} RoomSayList 群资讯任务列表
 */
async function initSchedule(that) {
  const config = await allConfig() // 获取配置信息
  let scheduleList = await getScheduleList() // 获取定时任务
  const { dayTaskSchedule, roomNewsSchedule, roomTaskSchedule } = config
  if (scheduleList && scheduleList.length > 0) {
    for (let item of scheduleList) {
      setScheduleTask(that, item)
    }
  }
  if (dayTaskSchedule && dayTaskSchedule.length > 0) {
    for (let day of dayTaskSchedule) {
      setEveryDayTask(that, day)
    }
  }
  if (roomNewsSchedule && roomNewsSchedule.length > 0) {
    for (let room of roomNewsSchedule) {
      setEveryDayRoomSayTask(that, room)
    }
  }
  if (roomTaskSchedule && roomTaskSchedule.length > 0) {
    for (let room of roomTaskSchedule) {
      setRoomTask(that, room)
    }
  }
}

/**
 * 登录成功监听事件
 * @param {*} user 登录用户
 */
async function onLogin(user) {
  console.log(`贴心助理${user}登录了`)
  console.log(user.payload)
  await sendError('')
  await getConfig() // 获取配置文件
  await addUser(user.payload) // 全局存储登录用户信息
  await sendAvatar(user.payload.avatar) // 更新用户头像
  await delay(6000)
  initSchedule(this) // 初始化任务
}

module.exports = onLogin
