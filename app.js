const Discord = require('discord.js')
const cron = require('node-cron')
const settings = require('./settings/settings.json')
const { connect, makeUser, makeGuild } = require('./library/persistence')

let client = new Discord.Client({ fetchAllMembers: true })

// check devmode state
if (settings.dev_mode) {
  settings.token = settings.beta_token
  settings.prefix = settings.beta_prefix
}

require('./library/client_functions.js')(client)
client.log('Loaded client functions')

require('./library/client_events.js')(client)
client.log('Loaded client events')

require('./library/leaderboard_fetch.js')(client)
client.log('Loaded leaderboard functions')

// weekly wipe at 12 am on monday
cron.schedule('0 0 * * mon', async () => {
  await client.submitWeek()
  await client.userRepository.resetSessionTimes()
  client.log('Cleared weekly results')
}, {
  timezone: 'America/New_York'
})

connect('mongodb://localhost:27017/', 'pinano').then(mongoManager => {
  client.log(`Connected Database`)

  client.userRepository = mongoManager.newUserRepository()
  client.guildRepository = mongoManager.newGuildRepository()
  client.makeUser = makeUser
  client.makeGuild = makeGuild
  client.login(settings.token)
    .catch((error) => {
      client.log(error)
      process.exit(1)
    })
})
