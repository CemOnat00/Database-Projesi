package service

import "github.com/bscc/go-backend/internal/domain/dto"

type AuthService interface {
	Kayit(req *dto.KayitIstegi) (*dto.AuthCevabi, error)
	Giris(req *dto.GirisIstegi) (*dto.AuthCevabi, error)
}

type KullaniciService interface {
	ProfilGetir(id uint) (*dto.KullaniciDTO, error)
	ProfilGuncelle(id uint, req *dto.ProfilGuncelleIstegi) (*dto.KullaniciDTO, error)
	SifreDegistir(id uint, req *dto.SifreDegistirIstegi) error
}

type EserService interface {
	Listele() ([]*dto.EserDTO, error)
	DetayGetir(id uint) (*dto.EserDTO, error)
}

type SanatciService interface {
	Listele() ([]*dto.SanatciDTO, error)
	DetayGetir(id uint) (*dto.SanatciDTO, error)
}

type EtkinlikService interface {
	Listele() ([]*dto.EtkinlikDTO, error)
	DetayGetir(id uint) (*dto.EtkinlikDTO, error)
}

type RezervasyonService interface {
	Olustur(kullaniciID uint, req *dto.RezervasyonOlusturIstegi) (*dto.RezervasyonDTO, error)
	Listele(kullaniciID uint) ([]*dto.RezervasyonDTO, error)
	Guncelle(kullaniciID, rezervasyonID uint, req *dto.RezervasyonGuncelleIstegi) (*dto.RezervasyonDTO, error)
	Iptal(kullaniciID, rezervasyonID uint) error
}

type SiparisService interface {
	Olustur(kullaniciID uint, req *dto.SiparisOlusturIstegi) (*dto.SiparisDTO, error)
	Listele(kullaniciID uint) ([]*dto.SiparisDTO, error)
	DetayGetir(kullaniciID, siparisID uint) (*dto.SiparisDTO, error)
}

type FavoriService interface {
	Ekle(kullaniciID uint, req *dto.FavoriEkleIstegi) error
	Kaldir(kullaniciID, eserID uint) error
	Listele(kullaniciID uint) ([]*dto.EserDTO, error)
}

type YorumService interface {
	Ekle(kullaniciID uint, req *dto.YorumEkleIstegi) (*dto.YorumDTO, error)
	Listele(referansID uint, referansTipi string, siralama string) (*dto.YorumListeCevabi, error)
	FaydaliBul(yorumID uint) error
	PuanVer(yorumID, kullaniciID uint, req *dto.YorumPuanIstegi) error
	YanitEkle(yoneticiID, yorumID uint, req *dto.YanitEkleIstegi) error
}

type DestekService interface {
	Olustur(kullaniciID uint, req *dto.DestekTalebiOlusturIstegi) (*dto.DestekTalebiDTO, error)
	Listele(kullaniciID uint) ([]*dto.DestekTalebiDTO, error)
}

type KampanyaService interface {
	KampanyaliEserleriListele() ([]*dto.KampanyaDTO, error)
	KullaniciyaOzelFirsatlar(kullaniciID uint) ([]*dto.OzelFirsatDTO, error)
}

type DestekMesajService interface {
	MesajGonder(kullaniciID, talepID uint, req *dto.DestekMesajGonderIstegi) (*dto.DestekMesajDTO, error)
	MesajlariGetir(talepID uint) ([]*dto.DestekMesajDTO, error)
}

type KarsilastirmaService interface {
	EserleriKarsilastir(kullaniciID uint, req *dto.EserKarsilastirIstegi) (*dto.EserKarsilastirSonucu, error)
	EtkinlikleriKarsilastir(kullaniciID uint, req *dto.EtkinlikKarsilastirIstegi) (*dto.EtkinlikKarsilastirSonucu, error)
}

type IstatistikService interface {
	EserIstatistigi(eserID uint) (*dto.EserIstatistikDTO, error)
	EtkinlikIstatistigi(etkinlikID uint) (*dto.EtkinlikIstatistikDTO, error)
	AdminRapor() (*dto.AdminRaporDTO, error)
}
