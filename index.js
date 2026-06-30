const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const db = require('quick.db');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Arama Botu Aktif!'));
app.listen(port);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    token: "DORDUNCU_BOT_TOKENINIZI_BURAYA_YAZIN",
    sunucuId: "1511859511634301059"
};

client.on('ready', () => {
    console.log(`🔍 ${client.user.tag} arama botu sorunsuz hazır!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || message.guild.id !== CONFIG.sunucuId) return;

    if (message.content.startsWith('.ara')) {
        const args = message.content.slice(4).trim().split('/');
        const aramaTerimi = message.content.slice(4).trim().toLowerCase();

        // 1. .ara oyuncular
        if (aramaTerimi === 'oyuncular') {
            const tumVeriler = db.all(); 
            const oyuncuListesi = tumVeriler.filter(veri => veri.id.startsWith('profil_'));

            if (oyuncuListesi.length === 0) {
                return message.reply("📋 Ligde henüz kayıtlı hiçbir oyuncu bulunmuyor!");
            }

            const embed = new EmbedBuilder()
                .setTitle("📋 LİGDEKİ TÜM AKTİF OYUNCULARIN LİSTESİ")
                .setColor("Blurple")
                .setTimestamp();

            let listeMetni = "";
            oyuncuListesi.forEach((o, index) => {
                const data = o.value;
                const userId = o.id.replace('profil_', '');
                listeMetni += `**${index + 1}.** 🏃 **${data.isim || "Bilinmiyor"}** | 🛡️ \`${data.mevki || "N/A"}\` | 🏳️ ${data.bayrak || "🏳️"} | 💰 \`${data.deger || "0"}\` (<@${userId}>)\n`;
            });

            embed.setDescription(listeMetni);
            return message.reply({ embeds: [embed] });
        }

        // 2. .ara SNT/oyuncu adı/bayrak
        if (args.length >= 2) {
            const filtreMevki = args[0] ? args[0].trim().toUpperCase() : null;
            const filtreIsim = args[1] ? args[1].trim().toLowerCase() : null;
            const filtreBayrak = args[2] ? args[2].trim() : null;

            const tumVeriler = db.all();
            const oyuncular = tumVeriler.filter(veri => veri.id.startsWith('profil_'));

            const bulunanlar = oyuncular.filter(o => {
                const d = o.value;
                const mevkiUyuşuyor = filtreMevki ? (d.mevki && d.mevki.toUpperCase().includes(filtreMevki)) : true;
                const isimUyuşuyor = filtreIsim ? (d.isim && d.isim.toLowerCase().includes(filtreIsim)) : true;
                const bayrakUyuşuyor = filtreBayrak ? (d.bayrak && d.bayrak.includes(filtreBayrak)) : true;
                return mevkiUyuşuyor && isimUyuşuyor && bayrakUyuşuyor;
            });

            if (bulunanlar.length === 0) {
                return message.reply("🔍 Aradığın kriterlere uygun bir oyuncu bulunamadı!");
            }

            const embed = new EmbedBuilder()
                .setTitle("🔍 Detaylı Oyuncu Arama Sonuçları")
                .setColor("Gold")
                .setFooter({ text: `Toplam ${bulunanlar.length} oyuncu listelendi.` })
                .setTimestamp();

            bulunanlar.forEach(o => {
                const data = o.value;
                embed.addFields({
                    name: `🏃 ${data.isim || "Bilinmeyen"} (${data.bayrak || "🏳️"})`,
                    value: `🛡️ **Mevki:** \`${data.mevki || "N/A"}\`\n💰 **Değer:** \`${data.deger || "0"}\`\n🏋️ **Antrenman:** \`${data.ant || "0/5"}\`\n⚽ **Penaltı:** \`${data.penGol || 0} Gol / ${data.penKacis || 0} Kaçan\``,
                    inline: false
                });
            });

            return message.reply({ embeds: [embed] });
        }

        return message.reply("⚠️ **Hatalı Kullanım!**\n• Tüm listeyi görmek için: `.ara oyuncular` \n• Detaylı arama için: `.ara Mevki / Oyuncu Adı / Bayrak` formatını kullanmalısın.");
    }
});

client.
    login(CONFIG.token);
