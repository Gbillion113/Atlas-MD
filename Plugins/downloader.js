import axios from "axios";

const api = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    Referer: "https://google.com",
  },
  timeout: 60000,
});

let mergedCommands = ["dl", "download"];

const TT =
  /(?<!\S)https?:\/\/(www\.)?(vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+(?=\s|$)/gi;
const IG = /https?:\/\/(www\.)?instagram\.com\/[^\s]+/gi;
const MF = /(?<!\S)https?:\/\/(www\.)?mediafire\.com\/\S+(?=\s|$)/gi;
const PIN =
  /https?:\/\/(www\.)?(pinterest\.(com|fr|de|co\.uk|jp|ru|ca|it|com\.au|com\.mx|com\.br|es|pl)|pin\.it)\/[^\s]+/gi;
const FB =
  /(?<!\S)https?:\/\/(www\.|m\.|web\.)?facebook\.com\/[^\s]+(?=\s|$)/gi;
const TW =
  /(?<!\S)https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\s]+(?=\s|$)/gi;
const VD = /https?:\/\/(www\.)?videy\.co\/[^\s]+/gi;
const TH = /https?:\/\/(www\.)?threads\.(net|com)\/[^\s]+/gi;
const MG = /https?:\/\/mega\.nz\/[^\s]+/gi;
const SC =
  /(?<!\S)https?:\/\/(www\.|on\.)?soundcloud\.com\/[^\s]+(?=\s|$)/gi;
const SP = /https?:\/\/open\.spotify\.com\/[^\s]+/gi;
const YT =
  /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+/gi;
const SF = /https?:\/\/sfile\.co\/[^\s]+/gi;

const ext = (txt) => {
  if (!txt) return null;

  const clean = (m) => m?.[0]?.replace(/[.,!?]$/, "");

  let m = txt.match(TT);
  if (m) return { type: "tt", url: clean(m) };

  m = txt.match(IG);
  if (m && !clean(m).includes("/stories/"))
    return { type: "ig", url: clean(m) };

  m = txt.match(PIN);
  if (m) return { type: "pin", url: clean(m) };

  m = txt.match(FB);
  if (m) {
    const u = clean(m);

    if (
      !u.includes("/login") &&
      !u.includes("/dialog") &&
      !u.includes("/plugins/")
    ) {
      return { type: "fb", url: u };
    }
  }

  m = txt.match(TW);
  if (m) return { type: "tw", url: clean(m) };

  m = txt.match(VD);
  if (m) return { type: "vd", url: clean(m) };

  m = txt.match(TH);
  if (m) return { type: "th", url: clean(m) };

  m = txt.match(MG);
  if (m) return { type: "mg", url: clean(m) };

  m = txt.match(SC);
  if (m) return { type: "sc", url: clean(m) };

  m = txt.match(SP);
  if (m) return { type: "sp", url: clean(m) };

  m = txt.match(YT);
  if (m) return { type: "yt", url: clean(m) };

  m = txt.match(SF);
  if (m) return { type: "sf", url: clean(m) };

  m = txt.match(MF);
  if (m) return { type: "mf", url: clean(m) };

  return null;
};

const tt = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    );

    if (d.code !== 0 || !d.data)
      throw new Error(d.msg || "TikTok API error");

    return d.data.images?.length
      ? { type: "image", data: d.data.images }
      : { type: "video", data: d.data.play };
  } catch (e) {
    throw new Error(
      `TikTok failed: ${e.response?.status || e.message}`
    );
  }
};

const ig = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api-faa.my.id/faa/igdl?url=${encodeURIComponent(url)}`
    );

    if (!d.status || !d.result || !d.result.url)
      throw new Error(d.message || "Instagram API error");

    return {
      urls: d.result.url,
      isVideo: d.result.metadata?.isVideo,
    };
  } catch (e) {
    throw new Error(
      `Instagram failed: ${e.response?.status || e.message}`
    );
  }
};

const pin = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api-faa.my.id/faa/pin-down?url=${encodeURIComponent(url)}`
    );

    if (!d.status || !d.result || !d.result.medias)
      throw new Error(d.message || "Pinterest API error");

    return d.result.medias;
  } catch (e) {
    throw new Error(
      `Pinterest failed: ${e.response?.status || e.message}`
    );
  }
};

const fb = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api-faa.my.id/faa/fbdownload?url=${encodeURIComponent(url)}`
    );

    if (!d.status || !d.result || !d.result.media)
      throw new Error(d.message || "Facebook API error");

    return d.result.media;
  } catch (e) {
    throw new Error(
      `Facebook failed: ${e.response?.status || e.message}`
    );
  }
};

const tw = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/twitter?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result)
      throw new Error(d.message || "Twitter/X API error");

    return {
      type: d.result.type,
      data: d.result.download_url,
    };
  } catch (e) {
    throw new Error(
      `Twitter/X failed: ${e.response?.status || e.message}`
    );
  }
};

const vd = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/videy?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result)
      throw new Error(d.message || "Videy API error");

    return d.result;
  } catch (e) {
    throw new Error(
      `Videy failed: ${e.response?.status || e.message}`
    );
  }
};

const mf = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api-faa.my.id/faa/mediafire?url=${encodeURIComponent(url)}`
    );

    if (!d.status || !d.result)
      throw new Error(d.message || "MediaFire API error");

    return d.result;
  } catch (e) {
    throw new Error(
      `MediaFire failed: ${e.response?.status || e.message}`
    );
  }
};

const th = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/threads?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result || !d.result.media)
      throw new Error(d.message || "Threads API error");

    return d.result.media;
  } catch (e) {
    throw new Error(
      `Threads failed: ${e.response?.status || e.message}`
    );
  }
};

const mg = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/mega?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result)
      throw new Error(d.message || "Mega API error");

    return d.result;
  } catch (e) {
    throw new Error(
      `Mega failed: ${e.response?.status || e.message}`
    );
  }
};

const sc = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/soundcloud?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result || !d.result.url)
      throw new Error(d.message || "SoundCloud API error");

    return d.result;
  } catch (e) {
    throw new Error(
      `SoundCloud failed: ${e.response?.status || e.message}`
    );
  }
};

const sp = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/spotify?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result || !d.result.url)
      throw new Error(d.message || "Spotify API error");

    return d.result;
  } catch (e) {
    throw new Error(
      `Spotify failed: ${e.response?.status || e.message}`
    );
  }
};

const yt = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result || !d.result.url)
      throw new Error(d.message || "YouTube API error");

    return d.result;
  } catch (e) {
    throw new Error(
      `YouTube failed: ${e.response?.status || e.message}`
    );
  }
};

const sf = async (url) => {
  try {
    const { data: d } = await api.get(
      `https://api.nexray.web.id/downloader/sfile?url=${encodeURIComponent(
        url
      )}`
    );

    if (!d.status || !d.result || !d.result.url)
      throw new Error(d.message || "Sfile API error");

    return d.result;
  } catch (e) {
    throw new Error(
      `Sfile failed: ${e.response?.status || e.message}`
    );
  }
};

export default {
  name: "universalDownloader",
  alias: [...mergedCommands],
  uniquecommands: ["download"],
  description: "Multi-platform media downloader",

  start: async (Atlas, m, { args, prefix, doReact }) => {
    let raw = args.join(" ").trim();

    if (!raw && m.quoted?.text) raw = m.quoted.text;

    if (!raw) {
      return m.reply(`*Universal Downloader*

*Supported Platforms:*
TikTok • Instagram • Pinterest • Facebook
Twitter/X • Threads • Videy • Mega
SoundCloud • Spotify • YouTube • Sfile
MediaFire

*Usage:* ${prefix}dl <url>
*Note:* Reply to a link also works`);
    }

    const url = ext(raw);

    if (!url) {
      return m.reply(
        "❌ Invalid URL. Please provide a valid supported link."
      );
    }

    if (doReact) await doReact("📥");

    try {
      switch (url.type) {
        case "tt": {
          const r = await tt(url.url);

          if (r.type === "video") {
            await Atlas.sendMessage(
              m.from,
              {
                video: { url: r.data },
                mimetype: "video/mp4",
              },
              { quoted: m }
            );
          } else {
            for (const img of r.data) {
              await Atlas.sendMessage(
                m.from,
                {
                  image: { url: img },
                },
                { quoted: m }
              );
            }
          }

          break;
        }

        case "ig": {
          const { urls, isVideo } = await ig(url.url);

          for (const link of urls) {
            await Atlas.sendMessage(
              m.from,
              isVideo
                ? {
                    video: { url: link },
                    mimetype: "video/mp4",
                  }
                : {
                    image: { url: link },
                  },
              { quoted: m }
            );
          }

          break;
        }

        case "yt": {
          const r = await yt(url.url);

          await Atlas.sendMessage(
            m.from,
            {
              audio: { url: r.url },
              mimetype: "audio/mpeg",
              fileName: `${r.title}.mp3`,
            },
            { quoted: m }
          );

          break;
        }

        default:
          return m.reply("⚠️ This platform is temporarily unavailable.");
      }

      if (doReact) await doReact("✅");
    } catch (e) {
      console.log("DOWNLOADER ERROR:");
      console.log(e.response?.data || e.message);

      m.reply(
        `❌ Error: ${
          e.response?.status
            ? `API returned ${e.response.status}`
            : e.message
        }`
      );

      if (doReact) await doReact("❌");
    }
  },
};