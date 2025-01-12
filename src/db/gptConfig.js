import nedb from "./nedb.js";
import path from "path";
import os from "os";
import fs from 'fs'
import globalConfig from "./global.js";

let rdb = null;

function initDb() {
  if(!rdb) {
    const baseDir = path.join(
      os.homedir(),
      path.sep,
      ".wechaty",
      "wechaty-panel-cache",
      globalConfig.getApikey(),
      path.sep
    );
    const dbpath = baseDir + "gptconfig.db";
    if (fs.existsSync(dbpath)) {
      fs.unlinkSync(dbpath);
    }
    rdb = nedb(dbpath)
  }
}

/**
 * 存储gpt配置
 * { contactName: '', contactId: '', roomName: '', roomId: '', input: '输入的问题', output: '输出内容', time: '时间' }
 * @param info
 * @returns {Promise<unknown>}
 */
export async function addGptConfig(info) {
  try {
    initDb()
    let doc = await rdb.insert(info);
    return doc;
  } catch (error) {
    console.log("插入数据错误", error);
  }

}
/**
 * 获取指定群的聊天记录
 * @param room
 * @returns {Promise<*>}
 */
export async function getAllGptConfig() {
  try {
    initDb()
    let search = await rdb.find({});
    return search;
  } catch (error) {
    console.log("查询数据错误", error);
  }
}

export async function getGptConfigById(id) {
  try {
    initDb()
    let search = await rdb.find({ id });
    return search[0];
  } catch (error) {
    console.log("查询数据错误", error);
  }
}

export async function updateAllGptConfig(infos) {
  try {
    initDb()
    for(const item of infos) {
      await rdb.update({_id: item._id}, item, {upsert: true })
    }
  } catch (error) {
    console.log('更新失败', error)
  }
}

export async function updateOneGptConfig(id, info) {
  try {
    let search = await rdb.update({id}, { ...info });
    return search;
  } catch (error) {
    console.log("查询数据错误", error);
  }
}

export function resetData() {
  const baseDir = path.join(
    os.homedir(),
    path.sep,
    ".wechaty",
    "wechaty-panel-cache",
    globalConfig.getApikey(),
    path.sep
  );
  const dbpath = baseDir + "gptconfig.db";

  if (fs.existsSync(dbpath)) {
    fs.unlinkSync(dbpath);
  }
}
