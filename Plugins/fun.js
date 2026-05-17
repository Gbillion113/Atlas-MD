import axios from "axios";
import got from "got";

const headers = { "User-Agent": "AtlasBot/1.0" };

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default {
  name: "fun",
  alias: [
    "truth", "dare", "coinflip", "dice", "fact",
    "gay", "lesbian", "simp", "ship", "pp", "iq",
    "roast", "compliment", "wyr", "wouldyourather",
    "meme", "joke", "rate", "8ball",
  ],
  uniquecommands: [
    "truth", "dare", "coinflip", "dice", "fact",
    "gay", "lesbian", "simp", "ship", "pp", "iq",
    "roast", "compliment", "wyr", "meme", "joke", "rate", "8ball",
  ],
  description: "Fun commands",
  start: async (Atlas, m, { text, args, prefix, inputCMD, mentionByTag, doReact, pushName }) => {

    const target = mentionByTag?.[0] ? `@${mentionByTag[0].split("@")[0]}` : (text || pushName);

    switch (inputCMD) {

      case "truth": {
        await doReact("🤔");
        const truths = [
          "What is your biggest fear?",
          "Have you ever lied to get out of trouble?",
          "What is the most embarrassing thing you've ever done?",
          "Have you ever kept a secret from your best friend?",
          "Who is your secret crush?",
          "What's the worst lie you've ever told?",
          "Have you ever cheated on a test?",
          "What's the most childish thing you still do?",
          "Have you ever peed in the pool?",
          "What is the most awkward text you've ever sent?",
          "What's a secret you've never told anyone?",
          "Who in this group do you think is the smartest?",
          "Have you ever ghosted someone?",
          "What is your worst habit?",
          "Have you ever snooped through someone else's phone?",
          "What was the most awkward romantic moment of your life?",
          "Who was your first crush?",
          "Have you ever practiced kissing in the mirror?",
          "What is the most embarrassing nickname you've ever had?",
          "Have you ever accidentally liked an old photo while stalking someone?",
          "What is the strangest dream you've had about someone in this group?",
          "Who do you think is the best looking in this group?",
          "What is the worst gift you have ever received?",
          "Have you ever cried while watching a movie? Which one?",
          "What is a song you secretly love but pretend to hate?",
          "Have you ever dropped food on the floor and eaten it?",
          "What is your biggest insecurity?",
          "What is the weirdest thing you do when you are alone?",
          "Have you ever stolen anything?",
          "Who is the last person you searched for on Instagram?",
        ];
        await Atlas.sendMessage(m.from, { text: `🤔 *TRUTH*\n\n${randomItem(truths)}` }, { quoted: m });
        break;
      }

      case "dare": {
        await doReact("😎");
        const dares = [
          "Do a silly dance for 30 seconds.",
          "Let someone write a word on your forehead.",
          "Speak in a weird accent for the next 3 rounds.",
          "Let the group look through your photo gallery for 1 minute.",
          "Post a completely random status right now.",
          "Send a strange emoji to the 5th person in your contacts.",
          "Bark like a dog for 10 seconds.",
          "Call a random number and sing Happy Birthday.",
          "Draw a mustache on your face with a pen.",
          "Do 20 jumping jacks.",
          "Send an 'I love you' text to a random contact.",
          "Take a selfie making the ugliest face possible and post it.",
          "Speak entirely in rhyme for the next 5 minutes.",
          "Eat a spoonful of mustard.",
          "Recite the alphabet backwards.",
          "Talk like a pirate for the next 3 statements.",
          "Pretend to be a cat and purr at someone.",
          "Give a 1-minute speech on why the sky is blue.",
          "Walk backward for the next 5 minutes.",
          "Do your best impression of a famous celebrity.",
          "Let the group choose an object for you to sell to them.",
          "Lay on the floor and act like a sizzling piece of bacon.",
          "Let someone put an ice cube down your back.",
          "Do 15 sit-ups.",
          "Let the group wrap you in toilet paper.",
        ];
        await Atlas.sendMessage(m.from, { text: `😎 *DARE*\n\n${randomItem(dares)}` }, { quoted: m });
        break;
      }

      case "coinflip": {
        await doReact("🪙");
        m.reply(`🪙 ${Math.random() < 0.5 ? "HEADS" : "TAILS"}!`);
        break;
      }

      case "dice": {
        await doReact("🎲");
        const max = parseInt(args[0]) || 6;
        m.reply(`🎲 You rolled a *${Math.floor(Math.random() * max) + 1}*!`);
        break;
      }

      case "fact": {
        await doReact("🤓");
        try {
          const res = await got("https://uselessfacts.jsph.pl/api/v2/facts/random", { headers }).json();
          m.reply(`🤓 *Random Fact*\n\n${res.text}`);
        } catch {
          const facts = [
            "Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs.",
            "A group of flamingos is called a flamboyance.",
            "Bananas are berries, but strawberries aren't.",
            "Octopuses have three hearts.",
            "The Eiffel Tower grows about 6 inches in summer due to heat.",
          ];
          m.reply(`🤓 *Random Fact*\n\n${randomItem(facts)}`);
        }
        break;
      }

      case "gay": {
        await doReact("🌈");
        const percent = Math.floor(Math.random() * 101);
        m.reply(`🌈 *Gay Meter*\n\n${target} is *${percent}%* gay!\n\n${"🏳️‍🌈".repeat(Math.floor(percent/10))}${"⬜".repeat(10 - Math.floor(percent/10))}`);
        break;
      }

      case "lesbian": {
        await doReact("🌸");
        const percent = Math.floor(Math.random() * 101);
        m.reply(`🌸 *Lesbian Meter*\n\n${target} is *${percent}%* lesbian!\n\n${"💗".repeat(Math.floor(percent/10))}${"⬜".repeat(10 - Math.floor(percent/10))}`);
        break;
      }

      case "simp": {
        await doReact("🥺");
        const percent = Math.floor(Math.random() * 101);
        m.reply(`🥺 *Simp Meter*\n\n${target} is *${percent}%* a simp!\n\n${"💘".repeat(Math.floor(percent/10))}${"⬜".repeat(10 - Math.floor(percent/10))}`);
        break;
      }

      case "pp": {
        await doReact("📏");
        const size = Math.floor(Math.random() * 16);
        m.reply(`📏 *PP Size*\n\n${target}'s pp size:\n8${"=".repeat(size)}D\n\nSize: *${size} inches*`);
        break;
      }

      case "iq": {
        await doReact("🧠");
        const iq = Math.floor(Math.random() * 151) + 50;
        let label = "";
        if (iq >= 160) label = "Genius 🧠";
        else if (iq >= 130) label = "Very Smart 😎";
        else if (iq >= 100) label = "Average 😐";
        else if (iq >= 70) label = "Below Average 😅";
        else label = "Please seek help 💀";
        m.reply(`🧠 *IQ Test*\n\n${target}'s IQ is *${iq}*\nStatus: ${label}`);
        break;
      }

      case "ship": {
        await doReact("💘");
        if (mentionByTag?.length < 2 && !text) return m.reply(`Usage: *${prefix}ship @user1 @user2*`);
        const p1 = mentionByTag?.[0] ? `@${mentionByTag[0].split("@")[0]}` : pushName;
        const p2 = mentionByTag?.[1] ? `@${mentionByTag[1].split("@")[0]}` : text || "Someone";
        const percent = Math.floor(Math.random() * 101);
        let label = percent >= 80 ? "Perfect Match 💍" : percent >= 60 ? "Great Match 💕" : percent >= 40 ? "Maybe 🤔" : percent >= 20 ? "Unlikely 😬" : "No chance 💔";
        m.reply(`💘 *Ship Meter*\n\n${p1} + ${p2}\n\n${"❤️".repeat(Math.floor(percent/10))}${"🖤".repeat(10 - Math.floor(percent/10))}\n\n*${percent}%* — ${label}`);
        break;
      }

      case "roast": {
        await doReact("🔥");
        const roasts = [
          "You're the reason the gene pool needs a lifeguard.",
          "If laughter is the best medicine, your face must be curing diseases.",
          "You're not stupid, you just have bad luck thinking.",
          "I'd agree with you, but then we'd both be wrong.",
          "You have the face of a saint — a Saint Bernard.",
          "You're proof that evolution can go in reverse.",
          "I'd call you an idiot, but that would be an insult to idiots.",
          "You're like a cloud. When you disappear, it's a beautiful day.",
          "If you were any more inbred, you'd be a sandwich.",
          "Your GPS must be broken — you clearly can't find your way.",
        ];
        await Atlas.sendMessage(m.from, { text: `🔥 *Roast for ${target}*\n\n${randomItem(roasts)}`, mentions: mentionByTag || [] }, { quoted: m });
        break;
      }

      case "compliment": {
        await doReact("💖");
        const compliments = [
          "You light up every room you walk into!",
          "You have the best laugh!",
          "You're more fun than bubble wrap!",
          "Your smile is contagious!",
          "You're a great listener!",
          "You make everyone around you better!",
          "You have a heart of gold!",
          "You're genuinely one of a kind!",
        ];
        await Atlas.sendMessage(m.from, { text: `💖 *Compliment for ${target}*\n\n${randomItem(compliments)}`, mentions: mentionByTag || [] }, { quoted: m });
        break;
      }

      case "wyr":
      case "wouldyourather": {
        await doReact("🤷");
        const wyrs = [
          ["Be able to fly", "Be invisible"],
          ["Never use social media again", "Never watch another movie"],
          ["Have unlimited money", "Live forever"],
          ["Be always cold", "Be always hot"],
          ["Speak all languages", "Play all instruments"],
          ["Fight 100 duck-sized horses", "Fight 1 horse-sized duck"],
          ["Know when you'll die", "Know how you'll die"],
          ["Always be 10 minutes late", "Always be 20 minutes early"],
          ["Lose all your money", "Lose all your photos"],
          ["Only eat spicy food forever", "Only eat bland food forever"],
        ];
        const [a, b] = randomItem(wyrs);
        m.reply(`🤷 *Would You Rather?*\n\n🅰️ ${a}\n\nOR\n\n🅱️ ${b}`);
        break;
      }

      case "joke": {
        await doReact("😂");
        try {
          const data = await got("https://official-joke-api.appspot.com/random_joke", { headers }).json();
          m.reply(`😂 *Joke*\n\n${data.setup}\n\n||${data.punchline}||`);
        } catch {
          const jokes = [
            "Why don't scientists trust atoms?\nBecause they make up everything!",
            "Why did the scarecrow win an award?\nBecause he was outstanding in his field!",
            "I told my wife she was drawing her eyebrows too high.\nShe looked surprised.",
          ];
          m.reply(`😂 *Joke*\n\n${randomItem(jokes)}`);
        }
        break;
      }

      case "meme": {
        await doReact("😂");
        try {
          const data = await got("https://meme-api.com/gimme", { headers }).json();
          await Atlas.sendMessage(m.from, { image: { url: data.url }, caption: `😂 *${data.title}*` }, { quoted: m });
        } catch {
          m.reply("❌ Couldn't fetch meme right now, try again!");
        }
        break;
      }

      case "rate": {
        await doReact("⭐");
        if (!text) return m.reply(`Usage: *${prefix}rate <anything>*`);
        const rating = (Math.random() * 10).toFixed(1);
        const stars = "⭐".repeat(Math.round(rating));
        m.reply(`⭐ *Rating*\n\n"${text}"\n\n${stars}\n*${rating}/10*`);
        break;
      }

      case "8ball": {
        await doReact("🎱");
        if (!text) return m.reply(`Usage: *${prefix}8ball <question>*`);
        const answers = [
          "✅ It is certain!", "✅ Without a doubt!", "✅ Yes, definitely!",
          "✅ You may rely on it.", "✅ As I see it, yes.",
          "🤔 Reply hazy, try again.", "🤔 Ask again later.",
          "🤔 Better not tell you now.", "🤔 Cannot predict now.",
          "❌ Don't count on it.", "❌ My reply is no.",
          "❌ My sources say no.", "❌ Very doubtful.", "❌ Outlook not so good.",
        ];
        m.reply(`🎱 *Magic 8-Ball*\n\nQ: ${text}\n\nA: *${randomItem(answers)}*`);
        break;
      }

      default:
        break;
    }
  },
};