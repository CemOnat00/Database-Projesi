package entity

import "time"

// ── Kullanıcılar ──────────────────────────────────────────────────────────────

type User struct {
	ID          uint      `gorm:"primaryKey;autoIncrement"                  json:"id"`
	AdSoyad     string    `gorm:"column:ad_soyad;not null;size:100"          json:"ad_soyad"`
	Email       string    `gorm:"column:email;uniqueIndex;not null;size:150" json:"email"`
	SifreHash   string    `gorm:"column:sifre_hash;not null;size:255"        json:"-"`
	Rol         string    `gorm:"column:rol;not null;default:'user'"         json:"rol"`
	KayitTarihi time.Time `gorm:"column:kayit_tarihi;autoCreateTime"         json:"kayit_tarihi"`
}

func (User) TableName() string { return "kullanicilar" }

// ── Sanatçılar ────────────────────────────────────────────────────────────────

type Sanatci struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	AdSoyad   string `gorm:"column:ad_soyad;not null;size:100" json:"ad_soyad"`
	Biyografi string `gorm:"column:biyografi;type:text"        json:"biyografi"`
}

func (Sanatci) TableName() string { return "sanatcilar" }

// ── Eserler ───────────────────────────────────────────────────────────────────

type Eser struct {
	ID            uint      `gorm:"primaryKey;autoIncrement"                json:"id"`
	SanatciID     uint      `gorm:"column:sanatci_id;not null"              json:"sanatci_id"`
	Baslik        string    `gorm:"column:baslik;not null;size:200"         json:"baslik"`
	Aciklama      string    `gorm:"column:aciklama;type:text"               json:"aciklama"`
	GorselURL     string    `gorm:"column:gorsel_url;size:255"              json:"gorsel_url"`
	Kategori      string    `gorm:"column:kategori;size:100"                json:"kategori"`
	Fiyat         float64   `gorm:"column:fiyat;type:numeric(10,2)"         json:"fiyat"`
	StokAdedi     int       `gorm:"column:stok_adedi"                       json:"stok_adedi"`
	EklenmeTarihi time.Time `gorm:"column:eklenme_tarihi;autoCreateTime"    json:"eklenme_tarihi"`

	// İlişkiler
	Sanatci Sanatci `gorm:"foreignKey:SanatciID" json:"sanatci,omitempty"`
}

func (Eser) TableName() string { return "eserler" }

// ── Etkinlikler ───────────────────────────────────────────────────────────────

type Etkinlik struct {
	ID             uint      `gorm:"primaryKey;autoIncrement"                   json:"id"`
	Baslik         string    `gorm:"column:baslik;not null;size:200"            json:"baslik"`
	Aciklama       string    `gorm:"column:aciklama;type:text"                  json:"aciklama"`
	EtkinlikTarihi time.Time `gorm:"column:etkinlik_tarihi"                     json:"etkinlik_tarihi"`
	BaslangicSaati string    `gorm:"column:baslangic_saati"                     json:"baslangic_saati"`
	Kontenjan      int       `gorm:"column:kontenjan"                           json:"kontenjan"`
	Ucret          float64   `gorm:"column:ucret;type:numeric(10,2)"            json:"ucret"`
	EklenmeTarihi  time.Time `gorm:"column:eklenme_tarihi;autoCreateTime"       json:"eklenme_tarihi"`
}

func (Etkinlik) TableName() string { return "etkinlikler" }

// ── Rezervasyonlar ────────────────────────────────────────────────────────────

type Rezervasyon struct {
	ID               uint      `gorm:"primaryKey;autoIncrement"                    json:"id"`
	KullaniciID      uint      `gorm:"column:kullanici_id;not null"                json:"kullanici_id"`
	EtkinlikID       uint      `gorm:"column:etkinlik_id;not null"                 json:"etkinlik_id"`
	KatilimciSayisi  int       `gorm:"column:katilimci_sayisi"                     json:"katilimci_sayisi"`
	Durum            string    `gorm:"column:durum;default:'beklemede'"            json:"durum"`
	OlusturmaTarihi  time.Time `gorm:"column:olusturma_tarihi;autoCreateTime"      json:"olusturma_tarihi"`
	GuncellemeTarihi time.Time `gorm:"column:guncelleme_tarihi;autoUpdateTime"     json:"guncelleme_tarihi"`

	// İlişkiler
	Kullanici User     `gorm:"foreignKey:KullaniciID" json:"kullanici,omitempty"`
	Etkinlik  Etkinlik `gorm:"foreignKey:EtkinlikID"  json:"etkinlik,omitempty"`
}

func (Rezervasyon) TableName() string { return "rezervasyonlar" }

// ── Siparişler ────────────────────────────────────────────────────────────────

type Siparis struct {
	ID              uint      `gorm:"primaryKey;autoIncrement"               json:"id"`
	KullaniciID     uint      `gorm:"column:kullanici_id;not null"           json:"kullanici_id"`
	KuponID         *uint     `gorm:"column:kupon_id"                        json:"kupon_id"`
	ToplamTutar     float64   `gorm:"column:toplam_tutar;type:numeric(10,2)" json:"toplam_tutar"`
	OdemYontemi     string    `gorm:"column:odeme_yontemi"                   json:"odeme_yontemi"`
	Durum           string    `gorm:"column:durum;default:'beklemede'"       json:"durum"`
	OlusturmaTarihi time.Time `gorm:"column:olusturma_tarihi;autoCreateTime" json:"olusturma_tarihi"`

	// İlişkiler
	Kullanici User           `gorm:"foreignKey:KullaniciID"  json:"kullanici,omitempty"`
	Detaylar  []SiparisDetay `gorm:"foreignKey:SiparisID"   json:"detaylar,omitempty"`
}

func (Siparis) TableName() string { return "siparisler" }

type SiparisDetay struct {
	SiparisID  uint    `gorm:"column:siparis_id;primaryKey"          json:"siparis_id"`
	EserID     uint    `gorm:"column:eser_id;primaryKey"             json:"eser_id"`
	BirimFiyat float64 `gorm:"column:birim_fiyat;type:numeric(10,2)" json:"birim_fiyat"`

	Eser Eser `gorm:"foreignKey:EserID" json:"eser,omitempty"`
}

func (SiparisDetay) TableName() string { return "siparis_detaylari" }

// ── Favoriler ─────────────────────────────────────────────────────────────────

type Favori struct {
	KullaniciID   uint      `gorm:"column:kullanici_id;primaryKey"         json:"kullanici_id"`
	EserID        uint      `gorm:"column:eser_id;primaryKey"              json:"eser_id"`
	EklenmeTarihi time.Time `gorm:"column:eklenme_tarihi;autoCreateTime"   json:"eklenme_tarihi"`

	Eser Eser `gorm:"foreignKey:EserID" json:"eser,omitempty"`
}

func (Favori) TableName() string { return "favoriler" }

// ── Yorumlar ──────────────────────────────────────────────────────────────────

type Yorum struct {
	ID              uint      `gorm:"primaryKey;autoIncrement"               json:"id"`
	KullaniciID     uint      `gorm:"column:kullanici_id;not null"           json:"kullanici_id"`
	ReferansID      uint      `gorm:"column:referans_id;not null"            json:"referans_id"`
	ReferansTipi    string    `gorm:"column:referans_tipi"                   json:"referans_tipi"` // "eser" veya "etkinlik"
	Puan            int       `gorm:"column:puan"                            json:"puan"`
	Metin           string    `gorm:"column:metin;type:text"                 json:"metin"`
	FaydalıOySayisi int       `gorm:"column:faydali_oy_sayisi;default:0"     json:"faydali_oy_sayisi"`
	DogrulanmisMi   bool      `gorm:"column:dogrulanmis_alici_mi;default:false" json:"dogrulanmis_mi"`
	OlusturmaTarihi time.Time `gorm:"column:olusturma_tarihi;autoCreateTime" json:"olusturma_tarihi"`

	Kullanici User          `gorm:"foreignKey:KullaniciID" json:"kullanici,omitempty"`
	Yanitlar  []YorumYaniti `gorm:"foreignKey:YorumID"     json:"yanitlar,omitempty"`
}

func (Yorum) TableName() string { return "yorumlar" }

type YorumYaniti struct {
	ID              uint      `gorm:"primaryKey;autoIncrement"               json:"id"`
	YorumID         uint      `gorm:"column:yorum_id;not null"               json:"yorum_id"`
	YoneticiID      uint      `gorm:"column:yonetici_id;not null"            json:"yonetici_id"`
	YanitMetni      string    `gorm:"column:yanit_metni;type:text"           json:"yanit_metni"`
	OlusturmaTarihi time.Time `gorm:"column:olusturma_tarihi;autoCreateTime" json:"olusturma_tarihi"`
}

func (YorumYaniti) TableName() string { return "yorum_yanitlari" }

// ── Kuponlar ──────────────────────────────────────────────────────────────────

type Kupon struct {
	ID               uint      `gorm:"primaryKey;autoIncrement"                  json:"id"`
	Kod              string    `gorm:"column:kod;uniqueIndex;not null;size:50"    json:"kod"`
	IndirimYuzdesi   float64   `gorm:"column:indirim_yuzdesi;type:numeric(5,2)"  json:"indirim_yuzdesi"`
	GecerlilikTarihi time.Time `gorm:"column:gecerlilik_tarihi"                  json:"gecerlilik_tarihi"`
	AktifMi          bool      `gorm:"column:aktif_mi;default:true"              json:"aktif_mi"`
}

func (Kupon) TableName() string { return "kuponlar" }

// ── Karşılaştırma Listeleri ───────────────────────────────────────────────────

type KarsilastirmaListesi struct {
	ID              uint      `gorm:"primaryKey;autoIncrement"               json:"id"`
	KullaniciID     uint      `gorm:"column:kullanici_id;not null"           json:"kullanici_id"`
	ListeAdi        string    `gorm:"column:liste_adi;size:100"              json:"liste_adi"`
	OlusturmaTarihi time.Time `gorm:"column:olusturma_tarihi;autoCreateTime" json:"olusturma_tarihi"`

	Ogeler []KarsilastirmaOgesi `gorm:"foreignKey:KarsilastirmaID" json:"ogeler,omitempty"`
}

func (KarsilastirmaListesi) TableName() string { return "karsilastirma_listeleri" }

type KarsilastirmaOgesi struct {
	KarsilastirmaID uint   `gorm:"column:karsilastirma_id;primaryKey" json:"karsilastirma_id"`
	ReferansID      uint   `gorm:"column:referans_id;primaryKey"      json:"referans_id"`
	ReferansTipi    string `gorm:"column:referans_tipi"               json:"referans_tipi"`
}

func (KarsilastirmaOgesi) TableName() string { return "karsilastirma_ogeleri" }

// ── Destek Talepleri ──────────────────────────────────────────────────────────

type DestekTalebi struct {
	ID              uint      `gorm:"primaryKey;autoIncrement"               json:"id"`
	KullaniciID     uint      `gorm:"column:kullanici_id;not null"           json:"kullanici_id"`
	Konu            string    `gorm:"column:konu;not null;size:150"          json:"konu"`
	Mesaj           string    `gorm:"column:mesaj;type:text"                 json:"mesaj"`
	Durum           string    `gorm:"column:durum;default:'acik';size:50"    json:"durum"`
	OlusturmaTarihi time.Time `gorm:"column:olusturma_tarihi;autoCreateTime" json:"olusturma_tarihi"`

	Kullanici User `gorm:"foreignKey:KullaniciID" json:"kullanici,omitempty"`
}

func (DestekTalebi) TableName() string { return "destek_talepleri" }

// ── Destek Mesajları ──────────────────────────────────────────────────────────

type DestekMesaj struct {
	ID              uint      `gorm:"primaryKey;autoIncrement"               json:"id"`
	TalepID         uint      `gorm:"column:talep_id;not null"               json:"talep_id"`
	GonderenID      uint      `gorm:"column:gonderen_id;not null"            json:"gonderen_id"`
	Mesaj           string    `gorm:"column:mesaj;type:text;not null"        json:"mesaj"`
	GonderenTipi    string    `gorm:"column:gonderen_tipi;size:20"           json:"gonderen_tipi"` // "kullanici" veya "admin"
	OlusturmaTarihi time.Time `gorm:"column:olusturma_tarihi;autoCreateTime" json:"olusturma_tarihi"`

	Gonderen User `gorm:"foreignKey:GonderenID" json:"gonderen,omitempty"`
}

func (DestekMesaj) TableName() string { return "destek_mesajlari" }
