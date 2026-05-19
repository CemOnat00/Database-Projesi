package repository

import (
	"errors"

	"github.com/bscc/go-backend/internal/domain/entity"
	domainrepo "github.com/bscc/go-backend/internal/domain/repository"
	"github.com/bscc/go-backend/internal/pkg/apperror"
	"gorm.io/gorm"
)

// ── Kullanıcı ─────────────────────────────────────────────────────────────────

type GormKullaniciRepo struct{ db *gorm.DB }

func NewKullaniciRepo(db *gorm.DB) domainrepo.KullaniciRepository {
	return &GormKullaniciRepo{db}
}

func (r *GormKullaniciRepo) Olustur(u *entity.User) error {
	if err := r.db.Create(u).Error; err != nil {
		return apperror.Internal("kullanıcı oluşturulamadı", err)
	}
	return nil
}

func (r *GormKullaniciRepo) IDileGetir(id uint) (*entity.User, error) {
	var u entity.User
	if err := r.db.First(&u, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("kullanıcı bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &u, nil
}

func (r *GormKullaniciRepo) EmailileGetir(email string) (*entity.User, error) {
	var u entity.User
	if err := r.db.Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("kullanıcı bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &u, nil
}

func (r *GormKullaniciRepo) Guncelle(u *entity.User) error {
	if err := r.db.Save(u).Error; err != nil {
		return apperror.Internal("güncelleme başarısız", err)
	}
	return nil
}

func (r *GormKullaniciRepo) EmailVarMi(email string) (bool, error) {
	var count int64
	r.db.Model(&entity.User{}).Where("email = ?", email).Count(&count)
	return count > 0, nil
}

// ── Eserler ───────────────────────────────────────────────────────────────────

type GormEserRepo struct{ db *gorm.DB }

func NewEserRepo(db *gorm.DB) domainrepo.EserRepository {
	return &GormEserRepo{db}
}

func (r *GormEserRepo) Listele() ([]*entity.Eser, error) {
	var eserler []*entity.Eser
	if err := r.db.Preload("Sanatci").Find(&eserler).Error; err != nil {
		return nil, apperror.Internal("eserler getirilemedi", err)
	}
	return eserler, nil
}

func (r *GormEserRepo) IDileGetir(id uint) (*entity.Eser, error) {
	var eser entity.Eser
	if err := r.db.Preload("Sanatci").First(&eser, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("eser bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &eser, nil
}

func (r *GormEserRepo) KategoriileListele(kategori string) ([]*entity.Eser, error) {
	var eserler []*entity.Eser
	if err := r.db.Preload("Sanatci").Where("kategori = ?", kategori).Find(&eserler).Error; err != nil {
		return nil, apperror.Internal("eserler getirilemedi", err)
	}
	return eserler, nil
}

func (r *GormEserRepo) Olustur(e *entity.Eser) error {
	if err := r.db.Create(e).Error; err != nil {
		return apperror.Internal("eser oluşturulamadı", err)
	}
	return nil
}

func (r *GormEserRepo) Guncelle(e *entity.Eser) error {
	if err := r.db.Save(e).Error; err != nil {
		return apperror.Internal("eser güncellenemedi", err)
	}
	return nil
}

func (r *GormEserRepo) Sil(id uint) error {
	if err := r.db.Delete(&entity.Eser{}, id).Error; err != nil {
		return apperror.Internal("eser silinemedi", err)
	}
	return nil
}

// ── Sanatçılar ────────────────────────────────────────────────────────────────

type GormSanatciRepo struct{ db *gorm.DB }

func NewSanatciRepo(db *gorm.DB) domainrepo.SanatciRepository {
	return &GormSanatciRepo{db}
}

func (r *GormSanatciRepo) Listele() ([]*entity.Sanatci, error) {
	var sanatcilar []*entity.Sanatci
	if err := r.db.Find(&sanatcilar).Error; err != nil {
		return nil, apperror.Internal("sanatçılar getirilemedi", err)
	}
	return sanatcilar, nil
}

func (r *GormSanatciRepo) IDileGetir(id uint) (*entity.Sanatci, error) {
	var s entity.Sanatci
	if err := r.db.First(&s, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("sanatçı bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &s, nil
}

func (r *GormSanatciRepo) Olustur(s *entity.Sanatci) error {
	if err := r.db.Create(s).Error; err != nil {
		return apperror.Internal("sanatçı oluşturulamadı", err)
	}
	return nil
}

func (r *GormSanatciRepo) Guncelle(s *entity.Sanatci) error {
	if err := r.db.Save(s).Error; err != nil {
		return apperror.Internal("sanatçı güncellenemedi", err)
	}
	return nil
}

func (r *GormSanatciRepo) Sil(id uint) error {
	if err := r.db.Delete(&entity.Sanatci{}, id).Error; err != nil {
		return apperror.Internal("sanatçı silinemedi", err)
	}
	return nil
}

// ── Etkinlikler ───────────────────────────────────────────────────────────────

type GormEtkinlikRepo struct{ db *gorm.DB }

func NewEtkinlikRepo(db *gorm.DB) domainrepo.EtkinlikRepository {
	return &GormEtkinlikRepo{db}
}

func (r *GormEtkinlikRepo) Listele() ([]*entity.Etkinlik, error) {
	var etkinlikler []*entity.Etkinlik
	if err := r.db.Find(&etkinlikler).Error; err != nil {
		return nil, apperror.Internal("etkinlikler getirilemedi", err)
	}
	return etkinlikler, nil
}

func (r *GormEtkinlikRepo) IDileGetir(id uint) (*entity.Etkinlik, error) {
	var e entity.Etkinlik
	if err := r.db.First(&e, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("etkinlik bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &e, nil
}

func (r *GormEtkinlikRepo) Olustur(e *entity.Etkinlik) error {
	if err := r.db.Create(e).Error; err != nil {
		return apperror.Internal("etkinlik oluşturulamadı", err)
	}
	return nil
}

func (r *GormEtkinlikRepo) Guncelle(e *entity.Etkinlik) error {
	if err := r.db.Save(e).Error; err != nil {
		return apperror.Internal("etkinlik güncellenemedi", err)
	}
	return nil
}

func (r *GormEtkinlikRepo) Sil(id uint) error {
	if err := r.db.Delete(&entity.Etkinlik{}, id).Error; err != nil {
		return apperror.Internal("etkinlik silinemedi", err)
	}
	return nil
}

// ── Rezervasyonlar ────────────────────────────────────────────────────────────

type GormRezervasyonRepo struct{ db *gorm.DB }

func NewRezervasyonRepo(db *gorm.DB) domainrepo.RezervasyonRepository {
	return &GormRezervasyonRepo{db}
}

func (r *GormRezervasyonRepo) Olustur(rez *entity.Rezervasyon) error {
	if err := r.db.Create(rez).Error; err != nil {
		return apperror.Internal("rezervasyon oluşturulamadı", err)
	}
	return nil
}

func (r *GormRezervasyonRepo) IDileGetir(id uint) (*entity.Rezervasyon, error) {
	var rez entity.Rezervasyon
	if err := r.db.Preload("Etkinlik").First(&rez, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("rezervasyon bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &rez, nil
}

func (r *GormRezervasyonRepo) KullaniciyaGoreListele(kullaniciID uint) ([]*entity.Rezervasyon, error) {
	var liste []*entity.Rezervasyon
	if err := r.db.Preload("Etkinlik").Where("kullanici_id = ?", kullaniciID).Find(&liste).Error; err != nil {
		return nil, apperror.Internal("rezervasyonlar getirilemedi", err)
	}
	return liste, nil
}

func (r *GormRezervasyonRepo) Guncelle(rez *entity.Rezervasyon) error {
	if err := r.db.Save(rez).Error; err != nil {
		return apperror.Internal("rezervasyon güncellenemedi", err)
	}
	return nil
}

// ── Siparişler ────────────────────────────────────────────────────────────────

type GormSiparisRepo struct{ db *gorm.DB }

func NewSiparisRepo(db *gorm.DB) domainrepo.SiparisRepository {
	return &GormSiparisRepo{db}
}

func (r *GormSiparisRepo) Olustur(s *entity.Siparis) error {
	if err := r.db.Create(s).Error; err != nil {
		return apperror.Internal("sipariş oluşturulamadı", err)
	}
	return nil
}

func (r *GormSiparisRepo) IDileGetir(id uint) (*entity.Siparis, error) {
	var s entity.Siparis
	if err := r.db.Preload("Detaylar.Eser").First(&s, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("sipariş bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &s, nil
}

func (r *GormSiparisRepo) KullaniciyaGoreListele(kullaniciID uint) ([]*entity.Siparis, error) {
	var liste []*entity.Siparis
	if err := r.db.Where("kullanici_id = ?", kullaniciID).Find(&liste).Error; err != nil {
		return nil, apperror.Internal("siparişler getirilemedi", err)
	}
	return liste, nil
}

// ── Favoriler ─────────────────────────────────────────────────────────────────

type GormFavoriRepo struct{ db *gorm.DB }

func NewFavoriRepo(db *gorm.DB) domainrepo.FavoriRepository {
	return &GormFavoriRepo{db}
}

func (r *GormFavoriRepo) Ekle(f *entity.Favori) error {
	if err := r.db.Create(f).Error; err != nil {
		return apperror.Internal("favoriye eklenemedi", err)
	}
	return nil
}

func (r *GormFavoriRepo) Kaldir(kullaniciID, eserID uint) error {
	if err := r.db.Where("kullanici_id = ? AND eser_id = ?", kullaniciID, eserID).
		Delete(&entity.Favori{}).Error; err != nil {
		return apperror.Internal("favoriden çıkarılamadı", err)
	}
	return nil
}

func (r *GormFavoriRepo) KullaniciyaGoreListele(kullaniciID uint) ([]*entity.Favori, error) {
	var liste []*entity.Favori
	if err := r.db.Preload("Eser.Sanatci").Where("kullanici_id = ?", kullaniciID).
		Find(&liste).Error; err != nil {
		return nil, apperror.Internal("favoriler getirilemedi", err)
	}
	return liste, nil
}

func (r *GormFavoriRepo) VarMi(kullaniciID, eserID uint) (bool, error) {
	var count int64
	r.db.Model(&entity.Favori{}).
		Where("kullanici_id = ? AND eser_id = ?", kullaniciID, eserID).Count(&count)
	return count > 0, nil
}

// ── Yorumlar ─────────────────────────────────────────────────────────────────

type GormYorumRepo struct{ db *gorm.DB }

func NewYorumRepo(db *gorm.DB) domainrepo.YorumRepository {
	return &GormYorumRepo{db}
}
func (r *GormYorumRepo) Ekle(y *entity.Yorum) error {
	if err := r.db.Create(y).Error; err != nil {
		return apperror.Internal("yorum eklenemedi", err)
	}
	return nil
}

func (r *GormYorumRepo) IDileGetir(id uint) (*entity.Yorum, error) {
	var y entity.Yorum
	if err := r.db.Preload("Kullanici").Preload("Yanitlar").First(&y, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("yorum bulunamadi")
		}
		return nil, apperror.Internal("veritabani hatasi", err)
	}
	return &y, nil
}

func (r *GormYorumRepo) ReferansaGoreListele(referansID uint, referansTipi string, siralama string) ([]*entity.Yorum, error) {
	var liste []*entity.Yorum
	query := r.db.Preload("Kullanici").Preload("Yanitlar").
		Where("referans_id = ? AND referans_tipi = ?", referansID, referansTipi)

	switch siralama {
	case "en_yuksek_puan":
		query = query.Order("puan DESC")
	case "en_faydali":
		query = query.Order("faydali_oy_sayisi DESC")
	default: // en_yeni
		query = query.Order("olusturma_tarihi DESC")
	}

	if err := query.Find(&liste).Error; err != nil {
		return nil, apperror.Internal("yorumlar getirilemedi", err)
	}
	return liste, nil
}

func (r *GormYorumRepo) OrtalamaPuanGetir(referansID uint, referansTipi string) (float64, int, error) {
	var sonuc struct {
		Ortalama float64
		Toplam   int
	}
	r.db.Model(&entity.Yorum{}).
		Select("AVG(puan) as ortalama, COUNT(*) as toplam").
		Where("referans_id = ? AND referans_tipi = ?", referansID, referansTipi).
		Scan(&sonuc)
	return sonuc.Ortalama, sonuc.Toplam, nil
}

func (r *GormYorumRepo) FaydaliBul(yorumID uint) error {
	if err := r.db.Model(&entity.Yorum{}).Where("id = ?", yorumID).
		UpdateColumn("faydali_oy_sayisi", gorm.Expr("faydali_oy_sayisi + 1")).Error; err != nil {
		return apperror.Internal("oy verilemedi", err)
	}
	return nil
}

func (r *GormYorumRepo) PuanVer(yorumID, kullaniciID uint, puan int) error {
	if err := r.db.Model(&entity.Yorum{}).Where("id = ?", yorumID).
		UpdateColumn("puan", puan).Error; err != nil {
		return apperror.Internal("puan verilemedi", err)
	}
	return nil
}

func (r *GormYorumRepo) YanitEkle(yanit *entity.YorumYaniti) error {
	if err := r.db.Create(yanit).Error; err != nil {
		return apperror.Internal("yanıt eklenemedi", err)
	}
	return nil
}

// ── Kupon ─────────────────────────────────────────────────────────────────────

type GormKuponRepo struct{ db *gorm.DB }

func NewKuponRepo(db *gorm.DB) domainrepo.KuponRepository {
	return &GormKuponRepo{db}
}

func (r *GormKuponRepo) KodileGetir(kod string) (*entity.Kupon, error) {
	var k entity.Kupon
	if err := r.db.Where("kod = ? AND aktif_mi = true", kod).First(&k).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("kupon bulunamadı veya geçersiz")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &k, nil
}

// ── Destek ────────────────────────────────────────────────────────────────────

type GormDestekRepo struct{ db *gorm.DB }

func NewDestekRepo(db *gorm.DB) domainrepo.DestekRepository {
	return &GormDestekRepo{db}
}

func (r *GormDestekRepo) Olustur(d *entity.DestekTalebi) error {
	if err := r.db.Create(d).Error; err != nil {
		return apperror.Internal("destek talebi oluşturulamadı", err)
	}
	return nil
}

func (r *GormDestekRepo) KullaniciyaGoreListele(kullaniciID uint) ([]*entity.DestekTalebi, error) {
	var liste []*entity.DestekTalebi
	if err := r.db.Where("kullanici_id = ?", kullaniciID).Find(&liste).Error; err != nil {
		return nil, apperror.Internal("destek talepleri getirilemedi", err)
	}
	return liste, nil
}

func (r *GormDestekRepo) IDileGetir(id uint) (*entity.DestekTalebi, error) {
	var d entity.DestekTalebi
	if err := r.db.First(&d, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("destek talebi bulunamadı")
		}
		return nil, apperror.Internal("veritabanı hatası", err)
	}
	return &d, nil
}

// ── Destek Mesajları ──────────────────────────────────────────────────────────

type GormDestekMesajRepo struct{ db *gorm.DB }

func NewDestekMesajRepo(db *gorm.DB) domainrepo.DestekMesajRepository {
	return &GormDestekMesajRepo{db}
}

func (r *GormDestekMesajRepo) Gonder(mesaj *entity.DestekMesaj) error {
	if err := r.db.Create(mesaj).Error; err != nil {
		return apperror.Internal("mesaj gönderilemedi", err)
	}
	return nil
}

func (r *GormDestekMesajRepo) TalepeMesajlariGetir(talepID uint) ([]*entity.DestekMesaj, error) {
	var mesajlar []*entity.DestekMesaj
	if err := r.db.Preload("Gonderen").
		Where("talep_id = ?", talepID).
		Order("olusturma_tarihi ASC").
		Find(&mesajlar).Error; err != nil {
		return nil, apperror.Internal("mesajlar getirilemedi", err)
	}
	return mesajlar, nil
}

// ── Karşılaştırma ─────────────────────────────────────────────────────────────

type GormKarsilastirmaRepo struct{ db *gorm.DB }

func NewKarsilastirmaRepo(db *gorm.DB) domainrepo.KarsilastirmaRepository {
	return &GormKarsilastirmaRepo{db}
}

func (r *GormKarsilastirmaRepo) ListeOlustur(liste *entity.KarsilastirmaListesi) error {
	if err := r.db.Create(liste).Error; err != nil {
		return apperror.Internal("liste oluşturulamadı", err)
	}
	return nil
}

func (r *GormKarsilastirmaRepo) OgeEkle(oge *entity.KarsilastirmaOgesi) error {
	if err := r.db.Create(oge).Error; err != nil {
		return apperror.Internal("öge eklenemedi", err)
	}
	return nil
}

func (r *GormKarsilastirmaRepo) KullaniciyaGoreListele(kullaniciID uint) ([]*entity.KarsilastirmaListesi, error) {
	var liste []*entity.KarsilastirmaListesi
	if err := r.db.Preload("Ogeler").Where("kullanici_id = ?", kullaniciID).Find(&liste).Error; err != nil {
		return nil, apperror.Internal("listeler getirilemedi", err)
	}
	return liste, nil
}

// ── Admin Repository ──────────────────────────────────────────────────────────

type GormAdminRepo struct{ db *gorm.DB }

func NewAdminRepo(db *gorm.DB) domainrepo.AdminRepository {
	return &GormAdminRepo{db}
}

func (r *GormAdminRepo) TumSiparisleri() ([]*entity.Siparis, error) {
	var liste []*entity.Siparis
	if err := r.db.Preload("Kullanici").Find(&liste).Error; err != nil {
		return nil, apperror.Internal("siparişler getirilemedi", err)
	}
	return liste, nil
}

func (r *GormAdminRepo) TumRezervasyonlari() ([]*entity.Rezervasyon, error) {
	var liste []*entity.Rezervasyon
	if err := r.db.Preload("Kullanici").Preload("Etkinlik").Find(&liste).Error; err != nil {
		return nil, apperror.Internal("rezervasyonlar getirilemedi", err)
	}
	return liste, nil
}

func (r *GormAdminRepo) TumDestekTaleplerini() ([]*entity.DestekTalebi, error) {
	var liste []*entity.DestekTalebi
	if err := r.db.Preload("Kullanici").Find(&liste).Error; err != nil {
		return nil, apperror.Internal("destek talepleri getirilemedi", err)
	}
	return liste, nil
}

func (r *GormAdminRepo) TumKullanicilari() ([]*entity.User, error) {
	var liste []*entity.User
	if err := r.db.Find(&liste).Error; err != nil {
		return nil, apperror.Internal("kullanıcılar getirilemedi", err)
	}
	return liste, nil
}
