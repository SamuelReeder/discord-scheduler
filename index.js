require('dotenv').config()

const Discord = require('discord.js');
const Sequelize = require('sequelize');
const date = require('date-and-time');

const client = new Discord.Client();
const PREFIX = '!';

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

const Times = sequelize.define('times', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    time: Sequelize.DATE,
    username: Sequelize.STRING,
    usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.time}!`);
    // Remove force: true for prod
    Times.sync();
    // { force: true }
});

client.on('message', async message => {
    if (message.content.startsWith(PREFIX)) {
        const input = message.content.slice(PREFIX.length).trim().split(' ');
        const command = input.shift();
        const commandArgs = input.join(' ');

        if (command === 'addtime') {
            const splitArgs = commandArgs.split(' ');

            const timeName = splitArgs.shift();
            const timeValue = splitArgs.join(' ');

            console.log(timeValue);

            try {
                const time = await Times.create({
                    name: timeName,
                    time: parseTime(timeValue),
                    username: message.author.username,
                });
                return message.reply(`Scheduled ${time.name} for ${time.time}`);
            }
            catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    return message.reply('Already scheduled');
                }
                return message.reply('Something went wrong');
            }
        } else if (command === 'time') {
            const timeName = commandArgs;
            const time = await Times.findOne({ where: { name: timeName } });
            if (time) {
                time.increment('usage_count');
                return message.channel.send(time.get('time'));
            }
            return message.reply(`Could not find time: ${timeName}`);
        } else if (command === 'edittime') {
            const splitArgs = commandArgs.split(' ');
            const timeName = splitArgs.shift();
            const timeValue = splitArgs.join(' ');

            const affectedRows = await Times.update({ time: parseTime(timeValue) }, { where: { name: timeName } });
            if (affectedRows > 0) {
                return message.reply(`Tag ${timeName} was edited.`);
            }
            return message.reply(`Could not find a time with name ${timeName}.`);
        } else if (command === 'timeinfo') {
            const timeName = commandArgs;

            const time = await Times.findOne({ where: { name: timeName } });
            if (time) {
                return message.channel.send(`${timeName} was created by ${time.username} at ${time.createdAt} and has been used ${time.usage_count} times.`);
            }
            return message.reply(`Could not find time: ${timeName}`);
        } else if (command === 'showtimes') {
            var scheduleEmbed = {
                color: 0x0099ff,
                title: 'Schedule',
                fields: [],
                timestamp: new Date(),
            };
            const timeList = await Times.findAll();
            timeList.forEach(t => {
                console.log(t.name);
                console.log(t.time);
                scheduleEmbed.fields.push({
                    name: t.name,
                    value: t.time.toString(),
                    inline: true
                })
            });
            
            return message.channel.send({ embed: scheduleEmbed });
        } else if (command === 'removetime') {
            const timeName = commandArgs;
            const rowCount = await Times.destroy({ where: { name: timeName } });
            if (!rowCount) return message.reply('That time did not exist.');

            return message.reply('Tag deleted.');
        }
    }

    if (message.author.bot) return;

    console.log(new Date().getFullYear().toString());
    if (message.content.toLowerCase().includes('$set')) {
        let m = message.content.trim().replace('$set ', '');
        let time = date.parse(`${m} ${new Date().getFullYear().toString()}`, 'MMMM D h:m A YYYY');
        console.log(time);
        schedule.times.push(
            {
                key: time,
                author: message.author.id,
            }
        );

    }

});


function parseTime(timeString) {
    return date.parse(`${timeString} ${new Date().getFullYear().toString()}`, 'MMMM D h:m A YYYY');
}

function timeToString(timeDate) {
    return date.format(timeDate, "MMMM D h:mm A YYYY");
}
client.login(process.env.DISCORD_SCHEDULE_BOT);