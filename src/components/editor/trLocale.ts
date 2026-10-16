import { en } from '@blocknote/core/locales'


type Dict = typeof en

const item = (
  key: keyof Dict['slash_menu'],
  title: string,
  subtext: string,
  group: string,
  aliases: string[] = [],
) => ({
  [key]: { ...en.slash_menu[key], title, subtext, group, aliases: [...en.slash_menu[key].aliases, ...aliases] },
})

const H = 'Başlıklar'
const SH = 'Alt başlıklar'
const B = 'Temel bloklar'
const M = 'Medya'

// BlockNote ships no Turkish dictionary, so the strings people actually see are translated here
// and everything else falls back to English.
export const tr: Dict = {
  ...en,
  slash_menu: {
    ...en.slash_menu,
    ...item('heading', 'Başlık 1', 'En üst düzey başlık', H, ['baslik']),
    ...item('heading_2', 'Başlık 2', 'Bölüm başlığı', H, ['baslik2']),
    ...item('heading_3', 'Başlık 3', 'Alt bölüm başlığı', H, ['baslik3']),
    ...item('heading_4', 'Başlık 4', 'Küçük alt başlık', SH),
    ...item('heading_5', 'Başlık 5', 'Daha küçük alt başlık', SH),
    ...item('heading_6', 'Başlık 6', 'En küçük başlık', SH),
    ...item('toggle_heading', 'Açılır başlık 1', 'Katlanabilir üst başlık', SH),
    ...item('toggle_heading_2', 'Açılır başlık 2', 'Katlanabilir bölüm başlığı', SH),
    ...item('toggle_heading_3', 'Açılır başlık 3', 'Katlanabilir alt başlık', SH),
    ...item('quote', 'Alıntı', 'Alıntı veya özet', B, ['alinti']),
    ...item('toggle_list', 'Açılır liste', 'Alt öğeleri gizlenebilen liste', B),
    ...item('numbered_list', 'Numaralı liste', 'Sıralı maddeler', B, ['numarali']),
    ...item('bullet_list', 'Madde listesi', 'Sırasız maddeler', B, ['madde', 'liste']),
    ...item('check_list', 'Yapılacaklar listesi', 'Onay kutulu liste', B, ['yapilacak', 'kutu']),
    ...item('paragraph', 'Metin', 'Düz paragraf', B, ['metin', 'paragraf']),
    ...item('code_block', 'Kod bloğu', 'Sözdizimi renklendirmeli kod', B, ['kod']),
    ...item('page_break', 'Sayfa sonu', 'Sayfa ayırıcı', B),
    ...item('table', 'Tablo', 'Düzenlenebilir hücreli tablo', 'Gelişmiş', ['tablo']),
    ...item('image', 'Görsel', 'Bağlantıdan görsel ekle', M, ['gorsel', 'resim']),
    ...item('video', 'Video', 'Bağlantıdan video ekle', M),
    ...item('audio', 'Ses', 'Bağlantıdan ses ekle', M, ['ses']),
    ...item('file', 'Dosya', 'Bağlantıdan dosya ekle', M, ['dosya']),
    ...item('emoji', 'Emoji', 'Emoji ara ve ekle', 'Diğer'),
    ...item('divider', 'Ayraç', 'Blokları çizgiyle ayır', B, ['ayrac', 'cizgi']),
  },
  placeholders: {
    ...en.placeholders,
    default: "Yazmaya başlayın ya da komutlar için '/' yazın",
    heading: 'Başlık',
    toggleListItem: 'Açılır öğe',
    bulletListItem: 'Liste',
    numberedListItem: 'Liste',
    checkListItem: 'Yapılacak',
  },
  file_blocks: {
    add_button_text: { image: 'Görsel ekle', video: 'Video ekle', audio: 'Ses ekle', file: 'Dosya ekle' },
  },
  toggle_blocks: {
    add_block_button: 'Boş açılır öğe. Blok eklemek için tıklayın.',
    toggle_button: 'Aç veya kapat',
  },
  side_menu: { add_block_label: 'Blok ekle', drag_handle_label: 'Blok menüsünü aç' },
  drag_handle: {
    ...en.drag_handle,
    delete_menuitem: 'Sil',
    colors_menuitem: 'Renkler',
  },
  suggestion_menu: { no_items_title: 'Sonuç yok' },
  color_picker: {
    text_title: 'Metin',
    background_title: 'Arka plan',
    colors: {
      default: 'Otomatik',
      gray: 'Gri',
      brown: 'Kahverengi',
      red: 'Kırmızı',
      orange: 'Turuncu',
      yellow: 'Sarı',
      green: 'Yeşil',
      blue: 'Mavi',
      purple: 'Mor',
      pink: 'Pembe',
    },
  },
  formatting_toolbar: {
    ...en.formatting_toolbar,
    bold: { tooltip: 'Kalın', secondary_tooltip: 'Mod+B' },
    italic: { tooltip: 'İtalik', secondary_tooltip: 'Mod+I' },
    underline: { tooltip: 'Altı çizili', secondary_tooltip: 'Mod+U' },
    strike: { tooltip: 'Üstü çizili', secondary_tooltip: 'Mod+Shift+S' },
    code: { tooltip: 'Kod', secondary_tooltip: '' },
    colors: { tooltip: 'Renkler' },
    link: { tooltip: 'Bağlantı ekle', secondary_tooltip: 'Mod+K' },
    nest: { tooltip: 'İçeri al', secondary_tooltip: 'Tab' },
    unnest: { tooltip: 'Dışarı al', secondary_tooltip: 'Shift+Tab' },
  },
}
