const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Arama Botu Aktif!'));
app.listen(port, '0.0.0.0', () => console.log(`Web sunucusu ${port} portunda hazır.`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    token: "DISCORD_DAN_ALDIĞIN_YENI_TOKENI_TAM_BURAYA_YAPIŞTIR",
    sunucuId: "1511859511634301059"
};

// Veritabanı dosyasını güvenli okuma fonksiyonu
function getDatabaseData() {
    try {
        if (fs.existsSync('json.sqlite')) {
            return JSON.parse(fs.readFileSync('json.sqlite', 'utf8'));
        }
    } catch (e) {
        console.log("Veritabanı okunurken bir sorun oluştu veya henüz veri yok.");
    }
    return {};
}

client.on('ready', () => {
    console.log(`🔍 ${client.user.tag} arama moduyla tamamen hazır!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || message.guild.id !== CONFIG.sunucuId) return;

    // Sadece .ara ile başlayan mesajları kontrol et
    if (message.content.startsWith('.ara')) {
        const args = message.content.slice(4).trim().split('/');
        const aramaTerimi = message.content.slice(4).trim().toLowerCase();

        const dbData = getDatabaseData();
        const keys = Object.keys(dbData);
        const profilKeys = keys.filter(k => k.startsWith('profil_'));

        // 1. .ara oyuncular (Tüm listeyi çeker)
        if (aramaTerimi === 'oyuncular') {
            if (profilKeys.length === 0) {
                return message.reply("📋 Ligde henüz kayıtlı hiçbir oyuncu bulunmuyor!");
            }

            const embed = new EmbedBuilder()
                .setTitle("📋 LİGDEKİ TÜM AKTİF OYUNCULARIN LİSTESİ")
                .setColor("Blurple")
                .setTimestamp();

            let listeMetni = "";
            profilKeys.forEach((key, index) => {
                const data = dbData[key];
                const userId = key.replace('profil_', '');
                listeMetni += `**${index + 1}.** 🏃 **${data.isim || "Bilinmiyor"}** | 🛡️ \`${data.mevki || "N/A"}\` | 🏳️ ${data.bayrak || "🏳️"} | 💰 \`${data.deger || "0"}\` (<@${userId}>)\n`;
            });

            embed.setDescription(listeMetni);
            return message.reply({ embeds: [embed] });
        }

        // 2. .ara SNT/oyuncu adı/bayrak (Detaylı filtreleme)
        if (args.length >= 2) {
            const filtreMevki = args[0] ? args[0].trim().toUpperCase() : null;
            const filtreIsim = args[1] ? args[1].trim().toLowerCase() : null;
            const filtreBayrak = args[2] ? args[2].trim() : null;

            const bulunanlar = profilKeys.filter(key => {
                const d = dbData[key];
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

            bulunanlar.forEach(key => {
                const data = dbData[key];
                embed.addFields({
                    name: `🏃 ${data.isim || "Bilinmeyen"} (${data.bayrak || "🏳️"})`,
                    value: `🛡️ **Mevki:** \`${data.mevki || "N/A"}\`\n💰 **Değer:** \`${data.deger || "0"}\`\n🏋️ **Antrenman:** \`${data.ant || "0/5"}\`\n⚽ **Penaltı:** \`${data.penGol || 0} Gol / ${data.penKacis || 0} Kaçan\``,
                    inline: false
                });
            });

            return message.reply({ embeds: [embed] });
        }

        // Hatalı kullanım uyarısı
        return message.reply("⚠️ **Hatalı Kullanım!**\n• Tüm listeyi görmek için: `.ara oyuncular` \n• Detaylı arama için: `.ara Mevki / Oyuncu Adı / Bayrak` formatını kullanmalısın.");
    }
});

client
    .login(CONFIG.token);
