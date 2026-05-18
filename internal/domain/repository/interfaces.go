package repository

import "github.com/bscc/go-backend/internal/domain/entity"

type KullaniciRepository interface {
	Olustur(kullanici *entity.User) error
	IDileGetir(id uint) (*entity.User, error)
	EmailileGetir(email string) (*entity.User, error)
	Guncelle(kullanici *entity.User) error
	EmailVarMi(email string) (bool, error)
}

type EserRepository interface {
	Listele() ([]*entity.Eser, error)
	IDileGetir(id uint) (*entity.Eser, error)
	KategoriileListele(kategori string) ([]*entity.Eser, error)
}

type SanatciRepository interface {
	Listele() ([]*entity.Sanatci, error)
	IDileGetir(id uint) (*entity.Sanatci, error)
}

type EtkinlikRepository interface {
	Listele() ([]*entity.Etkinlik, error)
	IDileGetir(id uint) (*entity.Etkinlik, error)
}

type RezervasyonRepository interface {
	Olustur(r *entity.Rezervasyon) error
	IDileGetir(id uint) (*entity.Rezervasyon, error)
	KullaniciyaGoreListele(kullaniciID uint) ([]*entity.Rezervasyon, error)
	Guncelle(r *entity.Rezervasyon) error
}

type SiparisRepository interface {
	Olustur(s *entity.Siparis) error
	IDileGetir(id uint) (*entity.Siparis, error)
	KullaniciyaGoreListele(kullaniciID uint) ([]*entity.Siparis, error)
}

type FavoriRepository interface {
	Ekle(f *entity.Favori) error
	Kaldir(kullaniciID, eserID uint) error
	KullaniciyaGoreListele(kullaniciID uint) ([]*entity.Favori, error)
	VarMi(kullaniciID, eserID uint) (bool, error)
}

type YorumRepository interface {
	Ekle(y *entity.Yorum) error
	IDileGetir(id uint) (*entity.Yorum, error)
	ReferansaGoreListele(referansID uint, referansTipi string, siralama string) ([]*entity.Yorum, error)
	OrtalamaPuanGetir(referansID uint, referansTipi string) (float64, int, error)
	FaydaliBul(yorumID uint) error
	PuanVer(yorumID, kullaniciID uint, puan int) error
	YanitEkle(yanit *entity.YorumYaniti) error
}

type KuponRepository interface {
	KodileGetir(kod string) (*entity.Kupon, error)
}

type KarsilastirmaRepository interface {
	ListeOlustur(liste *entity.KarsilastirmaListesi) error
	OgeEkle(oge *entity.KarsilastirmaOgesi) error
	KullaniciyaGoreListele(kullaniciID uint) ([]*entity.KarsilastirmaListesi, error)
}

type DestekRepository interface {
	Olustur(d *entity.DestekTalebi) error
	KullaniciyaGoreListele(kullaniciID uint) ([]*entity.DestekTalebi, error)
	IDileGetir(id uint) (*entity.DestekTalebi, error)
}

type DestekMesajRepository interface {
	Gonder(mesaj *entity.DestekMesaj) error
	TalepeMesajlariGetir(talepID uint) ([]*entity.DestekMesaj, error)
}
