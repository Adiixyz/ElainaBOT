const { create, Client } = require('@open-wa/wa-automate')
const welcome = require('./lib/welcome')
const left = require('./lib/left')
const cron = require('node-cron')
const color = require('./lib/color')
const fs = require('fs')
// const msgHndlr = require ('./tobz')
const figlet = require('figlet')
const lolcatjs = require('lolcatjs')
const options = require('./options')

// Cache handler and check for file change
require('./itsuki.js')
nocache('./itsuki.js', module => console.log(`'${module}' updated via coli`))
require('./lib/help.js')
nocache('./lib/help.js', module => console.log(`'${module}' update via ah ah yamete:v`))
require('./lib/database/setting.json')
nocache('./lib/database/setting.json', module => console.log(`'${module}' updated via pacar sange lo:v`))

const adminNumber = JSON.parse(fs.readFileSync('./lib/database/admin.json'))
const setting = JSON.parse(fs.readFileSync('./lib/database/setting.json'))
const isWhite = (chatId) => adminNumber.includes(chatId) ? true : false

let { 
    limitCount,
    memberLimit, 
    groupLimit,
    mtc: mtcState,
    banChats,
    restartState: isRestart
    } = setting

function restartAwal(tobz){
    setting.restartState = false
    isRestart = false
    tobz.sendText(setting.restartId, 'Restart Succesfull!')
    setting.restartId = 'undefined'
    //fs.writeFileSync('./lib/setting.json', JSON.stringify(setting, null,2));
}

lolcatjs.options.seed = Math.round(Math.random() * 1000);
lolcatjs.options.colors = true;

const start = async (tobz = new Client()) => {
        console.log('------------------------------------------------')
        lolcatjs.fromString(color(figlet.textSync('ITSUKI BOT', { horizontalLayout: 'full' })))
        console.log('------------------------------------------------')
        lolcatjs.fromString('[DEV] ITSUKI')
        lolcatjs.fromString('[SERVER] Server Started!')
        tobz.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))
        // Force it to keep the current session
        tobz.onStateChanged((state) => {
            console.log('[Client State]', state)
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') tobz.forceRefocus()
        })
        // listening on message
        tobz.onMessage((async (message) => {

        tobz.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 1000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    tobz.cutMsgCache()
                }
            })
        // msgHndlr(tobz, message)
        // Message Handler (Loaded from recent cache)
        require('./itsuki.js')(tobz, message)
    }))
           

        tobz.onGlobalParticipantsChanged((async (heuh) => {
            await welcome(tobz, heuh) 
            left(tobz, heuh)
            }))
        
        tobz.onAddedToGroup(async (chat) => {
            if(isWhite(chat.id)) return tobz.sendText(chat.id, 'Halo aku Elaina, Ketik #help Untuk Melihat List Command Ku...')
            if(mtcState === false){
                const groups = await tobz.getAllGroups()
                // BOT group count less than
                if(groups.length > groupLimit){
                    await tobz.sendText(chat.id, 'Maaf, Batas group yang dapat Itsuki tampung sudah penuh').then(async () =>{
                        tobz.leaveGroup(chat.id)
                    })
                }else{
                    if(chat.groupMetadata.participants.length < memberLimit){
                        await tobz.sendText(chat.id, `Maaf, BOT keluar jika member group tidak melebihi ${memberLimit} orang`).then(async () =>{
                            tobz.leaveGroup(chat.id)
                        })
                    }else{
                        if(!chat.isReadOnly) tobz.sendText(chat.id, 'Hi, Aku *Itsuki Bot*. silahkan ketik *.menu* untuk mulai!')
                    }
                }
            }else{
                await tobz.sendText(chat.id, 'Itsuki sedang maintenance, coba lain hari').then(async () => {
                    tobz.leaveGroup(chat.id)
                })
            }
        })

        /*tobz.onAck((x => {
            const { from, to, ack } = x
            if (x !== 3) tobz.sendSeen(to)
        }))*/

        // listening on Incoming Call
        tobz.onIncomingCall(( async (call) => {
            await tobz.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelfon = block!.\nJika ingin membuka block harap chat Owner!')
            .then(() => tobz.contactBlock(call.peerJid))
        }))
    }

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for coli')
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

create(options(true, start))
    .then(tobz => start(tobz))
    .catch((error) => console.log(error))
