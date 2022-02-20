const Discord = require('discord.js')
const Util = require('utils')
const Command = require('cmd')

const hgd = require('hgdUtils')
const config = require('../hgdConfig.json')
const settings = config.settings.morning

module.exports = class HgdMorningCommand extends Command {
  constructor (client) {
    super(client, {
      name: '早安簡',
      aliases: [
        '簡早安',
        '簡早安~',
        '早安簡~',
        '簡早',
        '早安',
        '早',
        '早!',
        '早安!簡',
        '簡早安!'
      ],
      category: '好感度',
      description: '早安!',
      usage: '早安簡',
      minArgs: 0,
      maxArgs: -1
    })
  }

  async run (message, args) {
    const diff = await hgd.getTimeDiff(message, 'Morning')
    const diffReq = timeDiff => timeDiff > settings.diffRequirement * 60
    const diffPass = diffReq(diff)
    const { levelPass, level, req } = await hgd.checkLevel(
      message,
      settings.lvRequirement
    )

    if (!levelPass) {
      const lvNotPassEmbed = new Discord.MessageEmbed()
        .setColor('#FB9EFF')
        .setAuthor(
          message.member.displayName,
          message.author.displayAvatarURL()
        )
        .setDescription(`您未達到可以進行該動作的等級 (${level}/${req})`)
        .setTimestamp()
        .setFooter('簡')
      return message.reply({ embeds: [lvNotPassEmbed] })
    }

    if (!hgd.timeInRange(settings.timeRange)) {
      const messages = config.messages.morning.timeNotInRange
      const timeNotInRangeEmbed = new Discord.MessageEmbed()
        .setColor('#FB9EFF')
        .setAuthor(
          message.member.displayName,
          message.author.displayAvatarURL()
        )
        .setDescription(`${messages[hgd.random(0, messages.length)].message}`)
        .setTimestamp()
        .setFooter('簡')
      return message.reply({ embeds: [timeNotInRangeEmbed] })
    }

    Util.printLog(
      'INFO',
      __filename,
      `time difference: ${diff} seconds; Pass: ${diffPass}`
    )
    const { min, max, minFail, maxFail } = settings.hgd
    const amount = diffPass
      ? hgd.random(min, max)
      : hgd.random(minFail, maxFail)
    const { oldHgd, newHgd, locked } = await hgd.add(message, 'Morning', amount)

    if (diffPass) {
      const texts = Util.randomFromArray(config.messages.morning.pass)
      const replyEmbed = new Discord.MessageEmbed()
        .setColor('#FB9EFF')
        .setTitle(
          `${hgd.strFormat(config.messages.morning.actionTitle, {
            displayName: message.member.displayName
          })}`
        )
        .setAuthor(
          message.member.displayName,
          message.author.displayAvatarURL()
        )
        .setDescription(
          `${hgd.strFormat(texts.message, {
            displayName: message.member.displayName
          })}\n好感度+${newHgd - oldHgd} (${oldHgd} \u279f ${
            locked ? '🔒' : ''
          } ${newHgd})`
        )
        .setTimestamp()
        .setFooter(`${texts.footer}`)
      message.reply({ embeds: [replyEmbed] })
      await hgd.spinShard(message, 2)
    } else {
      const texts = Util.randomFromArray(config.messages.morning.fail)
      const replyEmbed = new Discord.MessageEmbed()
        .setColor('#FB9EFF')
        .setTitle(
          `${message.member.displayName} ${config.messages.morning.actionTitle}`
        )
        .setAuthor(
          message.member.displayName,
          message.author.displayAvatarURL()
        )
        .setDescription(
          `${texts.message}\n好感度${amount} (${oldHgd} \u279f ${
            locked ? '🔒' : ''
          } ${newHgd})`
        )
        .setTimestamp()
        .setFooter(`${texts.footer}`)
      message.reply({ embeds: [replyEmbed] })
    }
  }
}
