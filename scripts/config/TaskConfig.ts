// ============================================================
// 文件：scripts/config/TaskConfig.ts
// 说明：每日/每周任务配置（目标、奖励）
// 负责人：F
// 调用方：
//   - C（任务面板展示）
//   - D（云函数中校验任务完成条件和奖励）
// 规则：只读不改
// ============================================================

import { ITaskData } from '../shared/Interfaces'

interface ITaskTemplate {
  taskId: string
  description: string
  target: number
  rewardCoins: number
  rewardExp: number
  rewardDiamonds: number
  type: 'daily' | 'weekly'
}

const TASK_TEMPLATES: ITaskTemplate[] = [

  // ======== 每日任务 ========
  {
    taskId: 'd1',
    description: '登录游戏',
    target: 1,
    rewardCoins: 20,
    rewardExp: 10,
    rewardDiamonds: 0,
    type: 'daily'
  },
  {
    taskId: 'd2',
    description: '浇水3次',
    target: 3,
    rewardCoins: 15,
    rewardExp: 10,
    rewardDiamonds: 0,
    type: 'daily'
  },
  {
    taskId: 'd3',
    description: '收获1次',
    target: 1,
    rewardCoins: 10,
    rewardExp: 15,
    rewardDiamonds: 0,
    type: 'daily'
  },
  {
    taskId: 'd4',
    description: '访问好友农场',
    target: 1,
    rewardCoins: 10,
    rewardExp: 5,
    rewardDiamonds: 0,
    type: 'daily'
  },
  {
    taskId: 'd5',
    description: '帮好友浇水',
    target: 1,
    rewardCoins: 10,
    rewardExp: 5,
    rewardDiamonds: 0,
    type: 'daily'
  },
  {
    taskId: 'd6',
    description: '种植2次',
    target: 2,
    rewardCoins: 15,
    rewardExp: 10,
    rewardDiamonds: 0,
    type: 'daily'
  },
  {
    taskId: 'd7',
    description: '卖出作物',
    target: 1,
    rewardCoins: 10,
    rewardExp: 5,
    rewardDiamonds: 0,
    type: 'daily'
  },

  // ======== 每周任务 ========
  {
    taskId: 'w1',
    description: '累计收获20个',
    target: 20,
    rewardCoins: 200,
    rewardExp: 50,
    rewardDiamonds: 0,
    type: 'weekly'
  },
  {
    taskId: 'w2',
    description: '连续登录7天',
    target: 7,
    rewardCoins: 100,
    rewardExp: 30,
    rewardDiamonds: 5,
    type: 'weekly'
  },
  {
    taskId: 'w3',
    description: '帮好友浇水5次',
    target: 5,
    rewardCoins: 80,
    rewardExp: 25,
    rewardDiamonds: 0,
    type: 'weekly'
  },
  {
    taskId: 'w4',
    description: '累计卖出500金币作物',
    target: 500,
    rewardCoins: 150,
    rewardExp: 40,
    rewardDiamonds: 3,
    type: 'weekly'
  },
]

export class TaskConfig {

  /**
   * 获取所有每日任务模板
   */
  static getDailyTemplates(): ITaskTemplate[] {
    return TASK_TEMPLATES.filter(t => t.type === 'daily')
  }

  /**
   * 获取所有每周任务模板
   */
  static getWeeklyTemplates(): ITaskTemplate[] {
    return TASK_TEMPLATES.filter(t => t.type === 'weekly')
  }

  /**
   * 获取指定任务模板
   */
  static get(taskId: string): ITaskTemplate {
    const t = TASK_TEMPLATES.find(t => t.taskId === taskId)
    if (!t) throw new Error(`未知任务: ${taskId}`)
    return t
  }

  /**
   * 将模板转为运行时任务数据（current=0, claimed=false）
   * D 在每日重置时调用
   */
  static toTaskData(template: ITaskTemplate): ITaskData {
    return {
      taskId: template.taskId,
      description: template.description,
      target: template.target,
      current: 0,
      rewardCoins: template.rewardCoins,
      rewardExp: template.rewardExp,
      rewardDiamonds: template.rewardDiamonds,
      claimed: false
    }
  }

  /** 获取所有模板 */
  static getAll(): ITaskTemplate[] {
    return TASK_TEMPLATES
  }
}
