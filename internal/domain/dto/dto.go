package dto

import "time"

// ── Auth ──────────────────────────────────────────────────────────────────────

type KayitIstegi struct {
	AdSoyad string `json:"ad_soyad" binding:"required,min=2,max=100"`
	Email   string `json:"email"    binding:"required,email"`
	Sifre   string `json:"sifre"    binding:"required,min=6"`
}

type GirisIstegi struct {
	Email string `json:"email" binding:"required,email"`
	Sifre string `json:"sifre" binding:"required"`
}

type AuthCevabi struct {
	Token     string       `json:"token"`
	Kullanici KullaniciDTO `json:"kullanici"`
}

// ── Kullanıcı ─────────────────────────────────────────────────────────────────

type KullaniciDTO struct {
	ID          uint      `json:"id"`
	AdSoyad     string    `json:"ad_soyad"`
	Email       string    `json:"email"`
	Rol         string    `json:"rol"`
	KayitTarihi time.Time `json:"kayit_tarihi"`
}

type ProfilGuncelleIstegi struct {
	AdSoyad string `json:"ad_soyad" binding:"omitempty,min=2,max=100"`
}

type SifreDegistirIstegi struct {
	EskiSifre string `json:"eski_sifre" binding:"required"`
	YeniSifre string `json:"yeni_sifre" binding:"required,min=6"`
}

// ── Eserler ───────────────────────────────────────────────────────────────────

type EserDTO struct {
	ID            uint        `json:"id"`
	Baslik        string      `json:"baslik"`
	Aciklama      string      `json:"aciklama"`
	GorselURL     string      `json:"gorsel_url"`
	Kategori      string      `json:"kategori"`
	Fiyat         float64     `json:"fiyat"`
	StokAdedi     int         `json:"stok_adedi"`
	EklenmeTarihi time.Time   `json:"eklenme_tarihi"`
	Sanatci       SanatciDTO  `json:"sanatci"`
	Gorseller     []GorselDTO `json:"gorseller,omitempty"`
}

// GorselDTO — eser veya etkinlik altındaki bir dosya görseli (yüklü dosya)
type GorselDTO struct {
	ID        uint   `json:"id"`
	URL       string `json:"url"` // istemciye gönderilecek tam yol (örn. /uploads/eserler/12/abc.jpg)
	Sira      int    `json:"sira"`
	PrimaryMi bool   `json:"primary_mi"`
}

// ── Sanatçılar ────────────────────────────────────────────────────────────────

type SanatciDTO struct {
	ID        uint   `json:"id"`
	AdSoyad   string `json:"ad_soyad"`
	Biyografi string `json:"biyografi"`
}

// ── Etkinlikler ───────────────────────────────────────────────────────────────

type EtkinlikDTO struct {
	ID             uint        `json:"id"`
	Baslik         string      `json:"baslik"`
	Aciklama       string      `json:"aciklama"`
	GorselURL      string      `json:"gorsel_url"`
	EtkinlikTarihi time.Time   `json:"etkinlik_tarihi"`
	BaslangicSaati string      `json:"baslangic_saati"`
	Kontenjan      int         `json:"kontenjan"`
	Ucret          float64     `json:"ucret"`
	Gorseller      []GorselDTO `json:"gorseller,omitempty"`
}

// ── Rezervasyonlar ────────────────────────────────────────────────────────────

type RezervasyonOlusturIstegi struct {
	EtkinlikID      uint `json:"etkinlik_id"      binding:"required"`
	KatilimciSayisi int  `json:"katilimci_sayisi" binding:"required,min=1"`
}

type RezervasyonGuncelleIstegi struct {
	KatilimciSayisi int    `json:"katilimci_sayisi" binding:"omitempty,min=1"`
	Durum           string `json:"durum"            binding:"omitempty"`
}

type RezervasyonDTO struct {
	ID               uint        `json:"id"`
	KatilimciSayisi  int         `json:"katilimci_sayisi"`
	Durum            string      `json:"durum"`
	OlusturmaTarihi  time.Time   `json:"olusturma_tarihi"`
	GuncellemeTarihi time.Time   `json:"guncelleme_tarihi"`
	Etkinlik         EtkinlikDTO `json:"etkinlik"`
}

// ── Siparişler ────────────────────────────────────────────────────────────────

type SiparisOlusturIstegi struct {
	EserIDler   []uint `json:"eser_idler"    binding:"required,min=1"`
	OdemYontemi string `json:"odeme_yontemi" binding:"required"`
	KuponKodu   string `json:"kupon_kodu"`
}

type SiparisDTO struct {
	ID              uint      `json:"id"`
	ToplamTutar     float64   `json:"toplam_tutar"`
	OdemYontemi     string    `json:"odeme_yontemi"`
	Durum           string    `json:"durum"`
	OlusturmaTarihi time.Time `json:"olusturma_tarihi"`
}

// ── Favoriler ─────────────────────────────────────────────────────────────────

type FavoriEkleIstegi struct {
	EserID uint `json:"eser_id" binding:"required"`
}

// ── Yorumlar ──────────────────────────────────────────────────────────────────

type YorumEkleIstegi struct {
	ReferansID   uint   `json:"referans_id"   binding:"required"`
	ReferansTipi string `json:"referans_tipi" binding:"required,oneof=eser etkinlik"`
	Puan         int    `json:"puan"          binding:"required,min=1,max=5"`
	Metin        string `json:"metin"         binding:"required,min=10"`
}

type YorumDTO struct {
	ID              uint             `json:"id"`
	Puan            int              `json:"puan"`
	Metin           string           `json:"metin"`
	FaydalıOySayisi int              `json:"faydali_oy_sayisi"`
	DogrulanmisMi   bool             `json:"dogrulanmis_mi"`
	OlusturmaTarihi time.Time        `json:"olusturma_tarihi"`
	Kullanici       KullaniciDTO     `json:"kullanici"`
	Yanitlar        []YorumYanitiDTO `json:"yanitlar"`
}

// YorumYanitiDTO — yoruma verilen küratör (admin) yanıtı.
type YorumYanitiDTO struct {
	ID              uint      `json:"id"`
	YanitMetni      string    `json:"yanit_metni"`
	OlusturmaTarihi time.Time `json:"olusturma_tarihi"`
}

type YanitEkleIstegi struct {
	YanitMetni string `json:"yanit_metni" binding:"required,min=5"`
}

// ── Destek ────────────────────────────────────────────────────────────────────

type DestekTalebiOlusturIstegi struct {
	Konu  string `json:"konu"  binding:"required,min=5,max=150"`
	Mesaj string `json:"mesaj" binding:"required,min=10"`
}

type DestekTalebiDTO struct {
	ID              uint      `json:"id"`
	Konu            string    `json:"konu"`
	Mesaj           string    `json:"mesaj"`
	Durum           string    `json:"durum"`
	OlusturmaTarihi time.Time `json:"olusturma_tarihi"`
}

// ── Kampanya ──────────────────────────────────────────────────────────────────

type KampanyaDTO struct {
	EserID         uint    `json:"eser_id,omitempty"`
	Baslik         string  `json:"baslik"`
	AsıFiyat       float64 `json:"asi_fiyat,omitempty"`
	Fiyat          float64 `json:"fiyat"`
	IndirimYuzdesi float64 `json:"indirim_yuzdesi"`
}

type OzelFirsatDTO struct {
	KuponKodu        string  `json:"kupon_kodu"`
	IndirimYuzdesi   float64 `json:"indirim_yuzdesi"`
	GecerlilikTarihi string  `json:"gecerlilik_tarihi"`
}

// ── Destek Mesajları ──────────────────────────────────────────────────────────

type DestekMesajGonderIstegi struct {
	Mesaj string `json:"mesaj" binding:"required,min=1"`
}

type DestekMesajDTO struct {
	ID              uint         `json:"id"`
	Mesaj           string       `json:"mesaj"`
	GonderenTipi    string       `json:"gonderen_tipi"`
	OlusturmaTarihi time.Time    `json:"olusturma_tarihi"`
	Gonderen        KullaniciDTO `json:"gonderen"`
}

// ── Karşılaştırma ─────────────────────────────────────────────────────────────

type EserKarsilastirIstegi struct {
	EserIDler []uint `json:"eser_idler" binding:"required,min=1,max=10"`
	Kaydet    bool   `json:"kaydet"` // sonucu kaydet mi?
}

type EtkinlikKarsilastirIstegi struct {
	EtkinlikIDler []uint `json:"etkinlik_idler" binding:"required,min=1,max=10"`
	Kaydet        bool   `json:"kaydet"`
}

type EserKarsilastirSonucu struct {
	Eserler []*EserDTO `json:"eserler"`
}

type EtkinlikKarsilastirSonucu struct {
	Etkinlikler []*EtkinlikDTO `json:"etkinlikler"`
}

// ── Yorum Filtreleme ──────────────────────────────────────────────────────────

type YorumListeIstegi struct {
	Siralama string `form:"siralama"` // "en_yeni", "en_yuksek_puan", "en_faydali"
}

type YorumListeCevabi struct {
	OrtalamaPuan float64     `json:"ortalama_puan"`
	ToplamYorum  int         `json:"toplam_yorum"`
	Yorumlar     []*YorumDTO `json:"yorumlar"`
}

type YorumPuanIstegi struct {
	Puan int `json:"puan" binding:"required,min=1,max=5"`
}

// ── İstatistik ────────────────────────────────────────────────────────────────

type EserIstatistikDTO struct {
	EserID       uint    `json:"eser_id"`
	Baslik       string  `json:"baslik"`
	ToplamFavori int64   `json:"toplam_favori"`
	ToplamYorum  int64   `json:"toplam_yorum"`
	OrtalamaPuan float64 `json:"ortalama_puan"`
}

type EtkinlikIstatistikDTO struct {
	EtkinlikID        uint    `json:"etkinlik_id"`
	Baslik            string  `json:"baslik"`
	ToplamRezervasyon int64   `json:"toplam_rezervasyon"`
	DolulukOrani      float64 `json:"doluluk_orani"`
	OrtalamaPuan      float64 `json:"ortalama_puan"`
}

type AdminRaporDTO struct {
	ToplamKullanici   int64   `json:"toplam_kullanici"`
	ToplamSiparis     int64   `json:"toplam_siparis"`
	ToplamRezervasyon int64   `json:"toplam_rezervasyon"`
	ToplamEser        int64   `json:"toplam_eser"`
	ToplamEtkinlik    int64   `json:"toplam_etkinlik"`
	ToplamGelir       float64 `json:"toplam_gelir"`
	OrtalamaPuan      float64 `json:"ortalama_puan"`
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

// Eser
type EserOlusturIstegi struct {
	SanatciID uint    `json:"sanatci_id" binding:"required"`
	Baslik    string  `json:"baslik"     binding:"required,min=2,max=200"`
	Aciklama  string  `json:"aciklama"`
	GorselURL string  `json:"gorsel_url"`
	Kategori  string  `json:"kategori"`
	Fiyat     float64 `json:"fiyat"      binding:"required,gt=0"`
	StokAdedi int     `json:"stok_adedi" binding:"min=0"`
}

type EserGuncelleIstegi struct {
	Baslik    string  `json:"baslik"     binding:"omitempty,min=2,max=200"`
	Aciklama  string  `json:"aciklama"   binding:"omitempty"`
	GorselURL string  `json:"gorsel_url" binding:"omitempty"`
	Kategori  string  `json:"kategori"   binding:"omitempty"`
	Fiyat     float64 `json:"fiyat"      binding:"omitempty,gt=0"`
	StokAdedi int     `json:"stok_adedi" binding:"omitempty,min=0"`
}

// Etkinlik
type EtkinlikOlusturIstegi struct {
	Baslik         string    `json:"baslik"          binding:"required,min=2,max=200"`
	Aciklama       string    `json:"aciklama"`
	GorselURL      string    `json:"gorsel_url"`
	EtkinlikTarihi time.Time `json:"etkinlik_tarihi" binding:"required"`
	BaslangicSaati string    `json:"baslangic_saati"`
	Kontenjan      int       `json:"kontenjan"       binding:"required,min=1"`
	Ucret          float64   `json:"ucret"`
}

type EtkinlikGuncelleIstegi struct {
	Baslik         string    `json:"baslik"          binding:"omitempty,min=2,max=200"`
	Aciklama       string    `json:"aciklama"        binding:"omitempty"`
	GorselURL      string    `json:"gorsel_url"      binding:"omitempty"`
	EtkinlikTarihi time.Time `json:"etkinlik_tarihi" binding:"omitempty"`
	BaslangicSaati string    `json:"baslangic_saati" binding:"omitempty"`
	Kontenjan      int       `json:"kontenjan"       binding:"omitempty,min=1"`
	Ucret          float64   `json:"ucret"           binding:"omitempty"`
}

// Sanatçı
type SanatciOlusturIstegi struct {
	AdSoyad   string `json:"ad_soyad"   binding:"required,min=2,max=100"`
	Biyografi string `json:"biyografi"`
}

type SanatciGuncelleIstegi struct {
	AdSoyad   string `json:"ad_soyad"   binding:"omitempty,min=2,max=100"`
	Biyografi string `json:"biyografi"  binding:"omitempty"`
}
