const { Client, GatewayIntentBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// GÜNCEL SUNUCU AYARLARI VE YETKİLİ ROLLERİ
// ==========================================
const KAYIT_YETKILI_ROL = '1520001240203919420'; 
const ROL_FUTBOLCU = '1519399605677068450'; 

// Yeni İstenen Yetkili Rolleri
const LIG_YONETICI_ROL = '1519414839561158828';
const OWNER_ROL = '1520770167720771644';
const TEKNIK_DIREKTOR_ROL = '1520770097558585344';
const TAKIM_BASKAN_ROL = '1520770097558585344'; // Belirttiğin ID'ye göre başkan rolü

const KAYIT_ODASI_ID = '1519029435750416604'; 
const KAYIT_DUYURU_KANAL_ID = '1519371653669322792'; 

// Hafıza Veritabanları
let oyuncuVerileri = {}; 
let cooldownlar = new Map();
let takimlar = {}; // Takım verilerinin tutulduğu alan

// Sayı Formatlama (Cüzdan gösterimi için)
function sayiFormatla(sayi) {
    if (isNaN(sayi)) return "0";
    if (sayi >= 1000000000) return (sayi / 1000000000).toFixed(1) + "B";
    if (sayi >= 1000000) return (sayi / 1000000).toFixed(1) + "M";
    if (sayi >= 1000) return (sayi / 1000).toFixed(1) + "K";
    return sayi.toString();
}

client.once('ready', () => {
    console.log(`⚽ Nors Bot Gelişmiş Lig Sistemiyle Aktif, Kanka!`
);
});
