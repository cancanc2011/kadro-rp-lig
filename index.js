const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');

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

// Veritabanını hiçbir kütüphane olmadan doğrudan ham veri olarak okur
function veritabaniniOku() {
    try {
        if (fs.existsSync('json.sqlite')) {
            const veri = fs.readFileSync('json.sqlite', 'utf8');
            return JSON.parse(veri);
        }
    } catch (hata) {
        console.log("Veri okuma pürüzü engellendi.");
    }
    return {};
}

client.on('ready', () => {
    console.log(`🔍 ${client.user.tag} arama botu sorunsuz hazır!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || message.guild.id !== CONFIG.sunucuId) return;

    if (message.content.startsWith('.ara')) {
        const args = message.content.slice(4).trim().split('/');
        const aramaTerimi = message.content.slice(4).trim().toLowerCase();

        const data = veritabaniniOku();
        const anahtarlar = Object.keys(data);
        const profilAnahtarlari = anahtarlar.filter(k => k.startsWith('profil_'));

        // 1. .ara oyuncular
        if (aramaTerimi === 'oyuncular') {
            if (profilAnahtarlari.length === 0) {
                return message.reply("📋 Ligde henüz kayıtlı hiçbir oyuncu bulunmuyor!");
            }

            const embed = new EmbedBuilder()
                .setTitle("📋 LİGDEKİ TÜM AKTİF OYUNCULARIN LİSTESİ")
                .setColor("Blurple")
                .setTimestamp();

            let listeMetni = "";
            profilAnahtarlari.forEach((anahtar, index) => {
                const oyuncu = data[anahtar];
                const userId = anahtar.replace('profil_', '');
                listeMetni += `**${index + 1}.** 🏃 **${oyuncu.isim || "Bilinmiyor"}** | 🛡️ \`${oyuncu.mevki || "N/A"}\` | 🏳️ ${oyuncu.bayrak || "🏳️"} | 💰 \`${oyuncu.deger || "0"}\` (<@${userId}>)\n`;
            });

            embed.setDescription(listeMetni);
            return message.reply({ embeds: [embed] });
        }

        // 2. .ara SNT/oyuncu adı/bayrak
        if (args.length >= 2) {
            const filtreMevki = args[0] ? args[0].trim().toUpperCase() : null;
            const filtreIsim = args[1] ? args[1].trim().toLowerCase() : null;
            const filtreBayrak = args[2] ? args[2].trim() : null;

            const bulunanlar = profilAnahtarlari.filter(anahtar => {
                const oyuncu = data[anahtar];
                const mevkiUyumlu = filtreMevki ? (oyuncu.mevki && oyuncu.mevki.toUpperCase().includes(filtreMevki)) : true;
                const isimUyumlu = filtreIsim ? (oyuncu.isim && oyuncu.isim.toLowerCase().includes(filtreIsim)) : true;
                const bayrakUyumlu = filtreBayrak ? (oyuncu.bayrak && oyuncu.bayrak.includes(filtreBayrak)) : true;
                return mevkiUyumlu && isimUyumlu && bayrakUyumlu;
            });

            if (bulunanlar.length === 0) {
                return message.reply("🔍 Aradığın kriterlere uygun bir oyuncu bulunamadı!");
            }

            const embed = new EmbedBuilder()
                .setTitle("🔍 Detaylı Oyuncu Arama Sonuçları")
                .setColor("Gold")
                .setFooter({ text: `Toplam ${bulunanlar.length} oyuncu listelendi.` })
                .setTimestamp();

            bulunanlar.forEach(anahtar => {
                const oyuncu = data[anahtar];
                embed.addFields({
                    name: `🏃 ${oyuncu.isim || "Bilinmeyen"} (${oyuncu.bayrak || "🏳️"})`,
                    value: `🛡️ **Mevki:** \`${oyuncu.mevki || "N/A"}\`\n💰 **Değer:** \`${oyuncu.deger || "0"}\`\n🏋️ **Antrenman:** \`${oyuncu.ant || "0/5"}\`\n⚽ **Penaltı:** \`${oyuncu.penGol || 0} Gol / ${oyuncu.penKacis || 0} Kaçan\``,
                    inline: false
                });
            });

            return message.reply({ embeds: [embed] });
        }

        return message.reply("⚠️ **Hatalı Kullanım!**\n• Tüm listeyi görmek için: `.ara oyuncular` \n• Detaylı arama için: `.ara Mevki / Oyuncu Adı / Bayrak` formatını kullanmalısın.");
    }
});

const CONFIG = {
    token: MTUyMTIwMTE1MDIzNjQyNjMxMQ.Gw__A0.wK4s5otLXF_L_cexMaGeX1UTHOco9QaOR2xPtg,
    sunucuId: "1511859511634301059"
};
