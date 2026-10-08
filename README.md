# Subanimo

**Türkçe** · [English](#english)

Konuşmalı videolarınızın altyazısından, videonun üstüne koyacağınız **şeffaf animasyonlar** üretir: başlıklar, sayaçlar, karşılaştırmalar, listeler, emojiler… Her animasyon ayrı bir video dosyası olarak çıkar ve DaVinci Resolve'a doğru zamanlarıyla tek seferde aktarılır.

> Yalnızca ticari olmayan kullanım içindir (PolyForm Noncommercial 1.0.0). Ayrıntılar: [Lisans](#lisans).

## Nasıl çalışır?

1. Videonuzun `.srt` altyazı dosyasını seçersiniz.
2. Subanimo size hazır bir metin (prompt) verir; bunu ChatGPT, Gemini veya Claude'a altyazıyla birlikte gönderirsiniz.
3. Yapay zekanın cevabını Subanimo'a yapıştırırsınız; hataları anında gösterir.
4. "Animasyonları üret" dersiniz. Çıkan `timeline.fcpxml` dosyasını Resolve'a alırsınız.

## Kolay kurulum

İhtiyacınız olan: macOS veya Windows, internet (yalnızca ilk kurulumda) ve yaklaşık 3 GB boş alan (üretilen videolar için ayrıca yer gerekir).

1. [Son sürüm sayfasından](https://github.com/subanimo/subanimo/releases/latest) `Subanimo-<sürüm>.zip` dosyasını (ör. `Subanimo-1.0.0.zip`) indirin ve açın.
2. **Mac:** `Subanimo.command` dosyasına **sağ tıklayın → Aç → Aç**. (Uygulama imzasız olduğu için macOS bunu yalnızca ilk seferde sorar. Çift tıklarsanız "geliştirici doğrulanamadı" uyarısı çıkar; o zaman sağ tık → Aç yolunu kullanın.)
   **Windows:** `Subanimo.bat` dosyasına çift tıklayın. "Windows bilgisayarınızı korudu" çıkarsa **Ek bilgi → Yine de çalıştır**.
3. İlk açılış birkaç dakika sürer: bileşenler program klasörünün içine indirilir. Bilgisayarınızda Node.js 20 veya üstü varsa o kullanılır; yoksa Node.js de program klasörüne indirilir. Bilgisayarınıza başka hiçbir şey kurulmaz.
4. Tarayıcınızda Subanimo açılır. Açılan siyah pencereyi, programı kullandığınız sürece kapatmayın.

Sonraki açılışlarda yalnızca 2. adım gerekir ve program birkaç saniyede açılır.

**Bilgisayarınızda bir yapay zeka asistanı varsa** (Claude Code, Cursor, Copilot vb.) ona "bu klasördeki AI_INSTALL.md dosyasına göre Subanimo'u kur ve başlat" demeniz yeterli.

## Kullanım

Tarayıcıdaki sayfa sizi dört adımda götürür. Çıktılar `Subanimo/<video adı>/` klasörüne (ana kullanıcı klasörünüzde) yazılır:

- `01-lowerThird.mov`, `02-questionHook.mov`, … şeffaf animasyonlar (ProRes 4444)
- `timeline.fcpxml` ve `timeline-V1.edl`: Resolve için zaman çizelgeleri
- `video-data.json` ve `subtitles.srt`: işin girdileri (aynı işi yeniden üretmek için)

**DaVinci Resolve'a eklemek (ücretsiz sürüm dahil):** Projenizi açın → **File → Import → Timeline…** → `timeline.fcpxml`. Animasyonlar doğru zamanlarda yeni bir timeline'a gelir. Videonuzun timeline'ı 01:00:00:00'dan başlamalıdır (Resolve'un varsayılanı).

## Sorun giderme

| Durum | Çözüm |
|---|---|
| İlk kurulum yarıda kaldı | Başlatıcıyı yeniden açın; kaldığı yerden devam eder. |
| "Disk dolu" | Yer açıp "Animasyonları üret"e yeniden basın; biten klipler korunur. |
| Windows'ta kurulum hatası | Subanimo klasörünü `C:\Subanimo` gibi kısa bir yola taşıyıp yeniden deneyin. |
| Yapay zekanın cevabında hata var | Sayfadaki "Sorunları kopyala" ile listeyi yapay zekaya "bunları düzelt" diyerek gönderin. |
| Sayfa "uygulamaya ulaşılamıyor" diyor | Siyah pencere kapanmış olabilir; başlatıcıyı yeniden açın. |

## Geliştiriciler için (CLI)

Node.js 20+ gerekir.

```bash
git clone https://github.com/subanimo/subanimo.git Subanimo && cd Subanimo
npm ci && npm run build
```

```bash
node dist/render.js app                                    # web arayüzünü başlat
node dist/render.js check plan.json --srt altyazi.srt     # yalnızca doğrula
node dist/render.js plan.json --srt altyazi.srt --skip-full --effects-dir cikti   # klipleri üret
node dist/render.js plan.json --srt altyazi.srt --preview  # her efektten bir PNG
node dist/render.js prompt --model chatgpt --count 30      # prompt'u yazdır
node dist/render.js prompts                                # prompts/ klasörünü yeniden üret
node dist/render.js catalog                                # efekt kataloğu (JSON)
```

Diğer seçenekler: `--resume` (biten klipleri atla), `--edl-only` (yalnızca zaman çizelgelerini yeniden yaz), `--start-tc 00:00:00:00`, `--frame N` (önizleme karesi). Plan dosyasının biçimi için `prompts/` klasöründeki dosyalara ve `node dist/render.js catalog` çıktısına bakın. CLI mesajları sistem diliniz Türkçe ise Türkçe gelir.

Sürüm paketi üretmek: `npm run package` → `release/Subanimo-<sürüm>.zip`.

## Lisans

Subanimo [PolyForm Noncommercial License 1.0.0](LICENSE) ile lisanslanmıştır. Kaynak kodu herkese açıktır (source-available) ama **açık kaynak lisanslı değildir**: ticari kullanım yasaktır.

- **İzin verilenler:** kişisel kullanım (hobi, öğrenme, kişisel projeler), okul, hayır kurumu ve kamu kurumu gibi ticari olmayan kurumların kullanımı; kodu değiştirmek ve aynı lisansla paylaşmak.
- **İzin verilmeyenler:** şirketlerin veya kişilerin ticari amaçla kullanması (ör. müşteri işi, reklamdan gelir elde edilen ticari içerik üretimi, ücretli hizmet).
- Bu bir özettir; bağlayıcı olan [LICENSE](LICENSE) metnidir.

- Animasyonlar [Remotion](https://www.remotion.dev) ile üretilir. Remotion'ın kendi lisansı da geçerlidir: [remotion.dev/license](https://www.remotion.dev/license).
- Fontlar ve emoji animasyonları kurulum sırasında kaynaklarından indirilir; lisansları için: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

<a id="english"></a>

# Subanimo (English)

Turns the subtitles of a talking-head video into **transparent animated overlays**: titles, counters, comparisons, lists, emoji… Every animation is rendered as its own video file and lands in DaVinci Resolve at the right time in one step.

> For non-commercial use only (PolyForm Noncommercial 1.0.0). See [License](#license).

## How it works

1. Pick your video's `.srt` subtitle file.
2. Subanimo gives you a ready-made prompt; send it to ChatGPT, Gemini or Claude together with the subtitles.
3. Paste the AI's answer into Subanimo; problems are shown right away.
4. Press "Create animations" and import the resulting `timeline.fcpxml` into Resolve.

## Easy install

You need macOS or Windows, an internet connection (first start only) and about 3 GB of free space (plus room for the rendered videos).

1. Download `Subanimo-<version>.zip` (e.g. `Subanimo-1.0.0.zip`) from the [latest release](https://github.com/subanimo/subanimo/releases/latest) and unzip it.
2. **Mac:** **right-click** `Subanimo.command` **→ Open → Open**. (The app is not signed, so macOS asks once. Double-clicking shows "developer cannot be verified"; use right-click → Open instead.)
   **Windows:** double-click `Subanimo.bat`. If "Windows protected your PC" appears, click **More info → Run anyway**.
3. The first start takes a few minutes: the components are downloaded into the app folder. If Node.js 20 or newer is already on your computer it is used; otherwise Node.js is downloaded into the app folder too. Nothing else is installed on your computer.
4. Subanimo opens in your browser. Keep the black window open while you use it.

Next time only step 2 is needed and the app opens in seconds.

**If you have an AI assistant on your computer** (Claude Code, Cursor, Copilot, …), just ask it: "install and start Subanimo following AI_INSTALL.md in this folder".

## Usage

The page walks you through four steps. Output goes to `Subanimo/<video name>/` in your home folder:

- `01-lowerThird.mov`, `02-questionHook.mov`, … transparent animations (ProRes 4444)
- `timeline.fcpxml` and `timeline-V1.edl`: timelines for Resolve
- `video-data.json` and `subtitles.srt`: the inputs (to recreate the same job)

**Adding them in DaVinci Resolve (free version included):** open your project → **File → Import → Timeline…** → `timeline.fcpxml`. The animations arrive on a new timeline at the right times. Your video's timeline should start at 01:00:00:00 (Resolve's default).

## Troubleshooting

| Problem | Fix |
|---|---|
| First-time setup stopped halfway | Start the launcher again; it continues where it stopped. |
| "Disk is full" | Free up space and press "Create animations" again; finished clips are kept. |
| Install error on Windows | Move the Subanimo folder to a short path such as `C:\Subanimo` and try again. |
| The AI's answer has problems | Use "Copy problems" and send the list back to the AI with "fix these". |
| The page says it cannot reach the app | The black window was probably closed; start the launcher again. |

## For developers (CLI)

Requires Node.js 20+.

```bash
git clone https://github.com/subanimo/subanimo.git Subanimo && cd Subanimo
npm ci && npm run build
```

```bash
node dist/render.js app                                    # start the web app
node dist/render.js check plan.json --srt subs.srt         # validate only
node dist/render.js plan.json --srt subs.srt --skip-full --effects-dir out   # render the clips
node dist/render.js plan.json --srt subs.srt --preview     # one PNG per effect
node dist/render.js prompt --model chatgpt --count 30      # print the prompt
node dist/render.js prompts                                # regenerate prompts/
node dist/render.js catalog                                # effect catalog (JSON)
```

More options: `--resume` (skip finished clips), `--edl-only` (rewrite the timelines only), `--start-tc 00:00:00:00`, `--frame N` (preview frame). For the plan format see `prompts/` and `node dist/render.js catalog`.

Build a release package: `npm run package` → `release/Subanimo-<version>.zip`.

## License

Subanimo is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). The source code is public (source-available) but **not open-source licensed**: commercial use is not allowed.

- **Allowed:** personal use (hobby, study, personal projects), use by non-commercial organizations such as schools, charities and public institutions, and changing and sharing the code under the same license.
- **Not allowed:** commercial use by companies or individuals (e.g. client work, commercial content production, paid services).
- This is a summary; the [LICENSE](LICENSE) text is what counts.

- Animations are rendered with [Remotion](https://www.remotion.dev), whose own license also applies: [remotion.dev/license](https://www.remotion.dev/license).
- Fonts and emoji animations are downloaded from their sources during setup; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
