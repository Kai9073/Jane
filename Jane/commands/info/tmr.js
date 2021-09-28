const Util = require('utils')
const Command = require('cmd')
const Discord = require('discord.js')
const Ss = require('sUser')

module.exports = class tomorrowCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'tomorrow',
      aliases: ['tmr'],
      category: '資訊',
      description: '查看翌日校歷表',
      usage: 'tomorrow',
      minArgs: 0,
      maxArgs: -1
    })
  }

  async run (message, args) {
    const offset = this.client.timezoneOffset + 24
    const dateWithOffset = new Date(new Date().getTime() + offset * 3600 * 1000)
      .toUTCString()
      .replace(/ GMT$/, '')
    const dateWithOffsetArray = dateWithOffset.split(' ')
    const formattedDate = dateWithOffsetArray[1] + dateWithOffsetArray[2]
    Util.printLog('INFO', __filename, `dateWithOffset: ${formattedDate}`)

    const student = new Ss(this.client, message.author.id)
    await student.saveData()
    let sClass
    if (student.class) {
      sClass = student.class
      Util.printLog('info', __filename, 'Timetable class: ' + sClass)
      const timetableEmbed = Util.getTimetableEmbed(
        formattedDate,
        '21sp',
        false,
        sClass
      )
      if (!timetableEmbed) {
        return message.inlineReply(
          Util.errEmbed(
            message,
            `簡在資料庫中找不到 ${formattedDate} 的課堂資料`,
            ''
          )
        )
      }
      message.inlineReply(timetableEmbed)
    } else {
      const filter = response => {
        return (
          ['3A', '3B', '3C', '3D'].includes(
            response.content.toUpperCase().replace(/ /g, '')
          ) && response.author.id === message.author.id
        )
      }
      const askClassEmbed = new Discord.MessageEmbed()
        .setDescription('請輸入你的班別 (3A/3B/3C/3D) **[輸入後無法更改]**')
        .setFooter('備註: 簡會記住你的班別, 以便下次查詢時間表時無須再次輸入')
        .setColor(this.client.colors.blue)
      const panel = await message.inlineReply(askClassEmbed)

      message.channel
        .awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
        .then(async collected => {
          sClass = collected.first().content
          Util.printLog('info', __filename, 'Collected class: ' + sClass)
          await student.addInfo('sClass', sClass)
          panel.delete()
          collected.first().delete()

          Util.printLog('info', __filename, 'Timetable class: ' + sClass)
          const timetableEmbed = Util.getTimetableEmbed(
            formattedDate,
            '21sp',
            false,
            sClass
          )
          if (!timetableEmbed) {
            return message.inlineReply(
              Util.errEmbed(
                message,
                `簡在資料庫中找不到 ${formattedDate} 的課堂資料`,
                ''
              )
            )
          }
          message.inlineReply(timetableEmbed)
        })
        .catch(collected => {
          panel.delete()
        })
    }
  }
}

/*
 */
