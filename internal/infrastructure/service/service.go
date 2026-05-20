package service

import (
	"mime/multipart"
	"path/filepath"
	"strconv"

	"github.com/bscc/go-backend/internal/domain/dto"
	"github.com/bscc/go-backend/internal/domain/entity"
	domainrepo "github.com/bscc/go-backend/internal/domain/repository"
	domainsvc "github.com/bscc/go-backend/internal/domain/service"
	"github.com/bscc/go-backend/internal/pkg/apperror"
	"github.com/bscc/go-backend/internal/pkg/jwt"
	"github.com/bscc/go-backend/internal/pkg/password"
	"github.com/bscc/go-backend/internal/pkg/upload"
	"gorm.io/gorm"
)

// ── Yardımcı dönüşüm fonksiyonları ───────────────────────────────────────────

func kullaniciDTO(u *entity.User) dto.KullaniciDTO {
	if u == nil {
		return dto.KullaniciDTO{}
	}
	return dto.KullaniciDTO{
		ID: u.ID, AdSoyad: u.AdSoyad,
		Email: u.Email, Rol: u.Rol, KayitTarihi: u.KayitTarihi,
	}
}

func eserDTO(e *entity.Eser) *dto.EserDTO {
	if e == nil {
		return nil
	}
	gorseller := make([]dto.GorselDTO, 0, len(e.Gorseller))
	for _, g := range e.Gorseller {
		gorseller = append(gorseller, dto.GorselDTO{
			ID: g.ID, URL: g.DosyaYolu, Sira: g.Sira, PrimaryMi: g.PrimaryMi,
		})
	}
	return &dto.EserDTO{
		ID: e.ID, Baslik: e.Baslik, Aciklama: e.Aciklama,
		GorselURL: e.GorselURL, Kategori: e.Kategori,
		Fiyat: e.Fiyat, StokAdedi: e.StokAdedi, EklenmeTarihi: e.EklenmeTarihi,
		Sanatci: dto.SanatciDTO{
			ID: e.Sanatci.ID, AdSoyad: e.Sanatci.AdSoyad, Biyografi: e.Sanatci.Biyografi,
		},
		Gorseller: gorseller,
	}
}

func etkinlikDTO(e *entity.Etkinlik) *dto.EtkinlikDTO {
	if e == nil {
		return nil
	}
	gorseller := make([]dto.GorselDTO, 0, len(e.Gorseller))
	for _, g := range e.Gorseller {
		gorseller = append(gorseller, dto.GorselDTO{
			ID: g.ID, URL: g.DosyaYolu, Sira: g.Sira, PrimaryMi: g.PrimaryMi,
		})
	}
	return &dto.EtkinlikDTO{
		ID:             e.ID,
		Baslik:         e.Baslik,
		Aciklama:       e.Aciklama,
		GorselURL:      e.GorselURL,
		EtkinlikTarihi: e.EtkinlikTarihi,
		BaslangicSaati: e.BaslangicSaati,
		Kontenjan:      e.Kontenjan,
		Ucret:          e.Ucret,
		Gorseller:      gorseller,
	}
}

func rezervasyonDTO(r *entity.Rezervasyon) *dto.RezervasyonDTO {
	return &dto.RezervasyonDTO{
		ID: r.ID, KatilimciSayisi: r.KatilimciSayisi, Durum: r.Durum,
		OlusturmaTarihi: r.OlusturmaTarihi, GuncellemeTarihi: r.GuncellemeTarihi,
		Etkinlik: *etkinlikDTO(&r.Etkinlik),
	}
}

// ── Auth Service ──────────────────────────────────────────────────────────────

var _ domainsvc.AuthService = (*AuthServiceImpl)(nil)

type AuthServiceImpl struct {
	repo       domainrepo.KullaniciRepository
	jwtManager *jwt.Manager
}

func NewAuthService(repo domainrepo.KullaniciRepository, jwtManager *jwt.Manager) domainsvc.AuthService {
	return &AuthServiceImpl{repo: repo, jwtManager: jwtManager}
}

func (s *AuthServiceImpl) Kayit(req *dto.KayitIstegi) (*dto.AuthCevabi, error) {
	varMi, _ := s.repo.EmailVarMi(req.Email)
	if varMi {
		return nil, apperror.Conflict("bu email zaten kayıtlı")
	}

	hash, err := password.Hash(req.Sifre)
	if err != nil {
		return nil, apperror.Internal("şifre işlenemedi", err)
	}

	kullanici := &entity.User{
		AdSoyad: req.AdSoyad, Email: req.Email,
		SifreHash: hash, Rol: "user",
	}
	if err := s.repo.Olustur(kullanici); err != nil {
		return nil, err
	}

	token, err := s.jwtManager.Generate(kullanici.ID, kullanici.Email, kullanici.Rol)
	if err != nil {
		return nil, apperror.Internal("token oluşturulamadı", err)
	}

	return &dto.AuthCevabi{Token: token, Kullanici: kullaniciDTO(kullanici)}, nil
}

func (s *AuthServiceImpl) Giris(req *dto.GirisIstegi) (*dto.AuthCevabi, error) {
	kullanici, err := s.repo.EmailileGetir(req.Email)
	if err != nil {
		return nil, apperror.Unauthorized("email veya şifre yanlış")
	}

	if !password.Check(req.Sifre, kullanici.SifreHash) {
		return nil, apperror.Unauthorized("email veya şifre yanlış")
	}

	token, err := s.jwtManager.Generate(kullanici.ID, kullanici.Email, kullanici.Rol)
	if err != nil {
		return nil, apperror.Internal("token oluşturulamadı", err)
	}

	return &dto.AuthCevabi{Token: token, Kullanici: kullaniciDTO(kullanici)}, nil
}

// ── Kullanıcı Service ─────────────────────────────────────────────────────────

var _ domainsvc.KullaniciService = (*KullaniciServiceImpl)(nil)

type KullaniciServiceImpl struct {
	repo domainrepo.KullaniciRepository
}

func NewKullaniciService(repo domainrepo.KullaniciRepository) domainsvc.KullaniciService {
	return &KullaniciServiceImpl{repo}
}

func (s *KullaniciServiceImpl) ProfilGetir(id uint) (*dto.KullaniciDTO, error) {
	u, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	d := kullaniciDTO(u)
	return &d, nil
}

func (s *KullaniciServiceImpl) ProfilGuncelle(id uint, req *dto.ProfilGuncelleIstegi) (*dto.KullaniciDTO, error) {
	u, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	if req.AdSoyad != "" {
		u.AdSoyad = req.AdSoyad
	}
	if err := s.repo.Guncelle(u); err != nil {
		return nil, err
	}
	d := kullaniciDTO(u)
	return &d, nil
}

func (s *KullaniciServiceImpl) SifreDegistir(id uint, req *dto.SifreDegistirIstegi) error {
	u, err := s.repo.IDileGetir(id)
	if err != nil {
		return err
	}
	if !password.Check(req.EskiSifre, u.SifreHash) {
		return apperror.Unauthorized("mevcut şifre yanlış")
	}
	hash, err := password.Hash(req.YeniSifre)
	if err != nil {
		return apperror.Internal("şifre işlenemedi", err)
	}
	u.SifreHash = hash
	return s.repo.Guncelle(u)
}

// ── Eser Service ──────────────────────────────────────────────────────────────

var _ domainsvc.EserService = (*EserServiceImpl)(nil)

type EserServiceImpl struct{ repo domainrepo.EserRepository }

func NewEserService(repo domainrepo.EserRepository) domainsvc.EserService {
	return &EserServiceImpl{repo}
}

func (s *EserServiceImpl) Listele() ([]*dto.EserDTO, error) {
	eserler, err := s.repo.Listele()
	if err != nil {
		return nil, err
	}
	result := make([]*dto.EserDTO, 0, len(eserler))
	for _, e := range eserler {
		result = append(result, eserDTO(e))
	}
	return result, nil
}

func (s *EserServiceImpl) DetayGetir(id uint) (*dto.EserDTO, error) {
	e, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	return eserDTO(e), nil
}

func (s *EserServiceImpl) Olustur(req *dto.EserOlusturIstegi) (*dto.EserDTO, error) {
	eser := &entity.Eser{
		SanatciID: req.SanatciID,
		Baslik:    req.Baslik,
		Aciklama:  req.Aciklama,
		GorselURL: req.GorselURL,
		Kategori:  req.Kategori,
		Fiyat:     req.Fiyat,
		StokAdedi: req.StokAdedi,
	}
	if err := s.repo.Olustur(eser); err != nil {
		return nil, err
	}
	return eserDTO(eser), nil
}

func (s *EserServiceImpl) Guncelle(id uint, req *dto.EserGuncelleIstegi) (*dto.EserDTO, error) {
	eser, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	if req.Baslik != "" {
		eser.Baslik = req.Baslik
	}
	if req.Aciklama != "" {
		eser.Aciklama = req.Aciklama
	}
	if req.GorselURL != "" {
		eser.GorselURL = req.GorselURL
	}
	if req.Kategori != "" {
		eser.Kategori = req.Kategori
	}
	if req.Fiyat > 0 {
		eser.Fiyat = req.Fiyat
	}
	if req.StokAdedi >= 0 {
		eser.StokAdedi = req.StokAdedi
	}
	if err := s.repo.Guncelle(eser); err != nil {
		return nil, err
	}
	return eserDTO(eser), nil
}

func (s *EserServiceImpl) Sil(id uint) error {
	// Önce diskteki görselleri temizle
	if gorseller, err := s.repo.GorselleriListele(id); err == nil {
		for _, g := range gorseller {
			_ = upload.Sil(g.DosyaYolu)
		}
	}
	return s.repo.Sil(id)
}

// GorselleriYukle — multipart dosyalarını diske yazar, eser_gorselleri
// tablosuna kaydeder ve eserin ana görselini (gorsel_url) primary olana ayarlar.
func (s *EserServiceImpl) GorselleriYukle(eserID uint, dosyalar []*multipart.FileHeader, primaryIndex int) ([]dto.GorselDTO, error) {
	eser, err := s.repo.IDileGetir(eserID)
	if err != nil {
		return nil, err
	}

	mevcut, _ := s.repo.GorselleriListele(eserID)
	basSira := len(mevcut)
	primaryVarMi := false
	for _, g := range mevcut {
		if g.PrimaryMi {
			primaryVarMi = true
			break
		}
	}

	altKlasor := filepath.Join("eserler", strconv.FormatUint(uint64(eserID), 10))
	sonuc := make([]dto.GorselDTO, 0, len(dosyalar))

	for i, dosya := range dosyalar {
		if ok, mesaj := upload.GecerliMi(dosya); !ok {
			return nil, apperror.BadRequest(mesaj)
		}
		yol, err := upload.Kaydet(dosya, altKlasor)
		if err != nil {
			return nil, apperror.Internal("görsel kaydedilemedi", err)
		}
		primary := (!primaryVarMi && i == primaryIndex)
		g := &entity.EserGorseli{
			EserID: eserID, DosyaYolu: yol,
			Sira: basSira + i, PrimaryMi: primary,
		}
		if err := s.repo.GorselEkle(g); err != nil {
			return nil, err
		}
		if primary {
			eser.GorselURL = yol
			_ = s.repo.Guncelle(eser)
		}
		sonuc = append(sonuc, dto.GorselDTO{
			ID: g.ID, URL: g.DosyaYolu, Sira: g.Sira, PrimaryMi: g.PrimaryMi,
		})
	}
	return sonuc, nil
}

func (s *EserServiceImpl) GorselSil(eserID, gorselID uint) error {
	g, err := s.repo.GorselGetir(gorselID)
	if err != nil {
		return err
	}
	if g.EserID != eserID {
		return apperror.BadRequest("görsel bu esere ait değil")
	}
	_ = upload.Sil(g.DosyaYolu)
	if err := s.repo.GorselSil(gorselID); err != nil {
		return err
	}
	// Silinen görsel primary ise, kalan ilk görseli primary yap
	if g.PrimaryMi {
		kalan, _ := s.repo.GorselleriListele(eserID)
		if len(kalan) > 0 {
			kalan[0].PrimaryMi = true
			_ = s.repo.GorselGuncelle(kalan[0])
			if eser, err := s.repo.IDileGetir(eserID); err == nil {
				eser.GorselURL = kalan[0].DosyaYolu
				_ = s.repo.Guncelle(eser)
			}
		}
	}
	return nil
}

// ── Sanatçı Service ───────────────────────────────────────────────────────────

var _ domainsvc.SanatciService = (*SanatciServiceImpl)(nil)

type SanatciServiceImpl struct{ repo domainrepo.SanatciRepository }

func NewSanatciService(repo domainrepo.SanatciRepository) domainsvc.SanatciService {
	return &SanatciServiceImpl{repo}
}

func (s *SanatciServiceImpl) Listele() ([]*dto.SanatciDTO, error) {
	sanatcilar, err := s.repo.Listele()
	if err != nil {
		return nil, err
	}
	result := make([]*dto.SanatciDTO, 0, len(sanatcilar))
	for _, s := range sanatcilar {
		result = append(result, &dto.SanatciDTO{
			ID: s.ID, AdSoyad: s.AdSoyad, Biyografi: s.Biyografi,
		})
	}
	return result, nil
}

func (s *SanatciServiceImpl) DetayGetir(id uint) (*dto.SanatciDTO, error) {
	sanatci, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	return &dto.SanatciDTO{
		ID: sanatci.ID, AdSoyad: sanatci.AdSoyad, Biyografi: sanatci.Biyografi,
	}, nil
}

func (s *SanatciServiceImpl) Olustur(req *dto.SanatciOlusturIstegi) (*dto.SanatciDTO, error) {
	sanatci := &entity.Sanatci{
		AdSoyad:   req.AdSoyad,
		Biyografi: req.Biyografi,
	}
	if err := s.repo.Olustur(sanatci); err != nil {
		return nil, err
	}
	return &dto.SanatciDTO{ID: sanatci.ID, AdSoyad: sanatci.AdSoyad, Biyografi: sanatci.Biyografi}, nil
}

func (s *SanatciServiceImpl) Guncelle(id uint, req *dto.SanatciGuncelleIstegi) (*dto.SanatciDTO, error) {
	sanatci, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	if req.AdSoyad != "" {
		sanatci.AdSoyad = req.AdSoyad
	}
	if req.Biyografi != "" {
		sanatci.Biyografi = req.Biyografi
	}
	if err := s.repo.Guncelle(sanatci); err != nil {
		return nil, err
	}
	return &dto.SanatciDTO{ID: sanatci.ID, AdSoyad: sanatci.AdSoyad, Biyografi: sanatci.Biyografi}, nil
}

func (s *SanatciServiceImpl) Sil(id uint) error {
	return s.repo.Sil(id)
}

// ── Etkinlik Service ──────────────────────────────────────────────────────────

var _ domainsvc.EtkinlikService = (*EtkinlikServiceImpl)(nil)

type EtkinlikServiceImpl struct{ repo domainrepo.EtkinlikRepository }

func NewEtkinlikService(repo domainrepo.EtkinlikRepository) domainsvc.EtkinlikService {
	return &EtkinlikServiceImpl{repo}
}

func (s *EtkinlikServiceImpl) Listele() ([]*dto.EtkinlikDTO, error) {
	etkinlikler, err := s.repo.Listele()
	if err != nil {
		return nil, err
	}
	result := make([]*dto.EtkinlikDTO, 0, len(etkinlikler))
	for _, e := range etkinlikler {
		result = append(result, etkinlikDTO(e))
	}
	return result, nil
}

func (s *EtkinlikServiceImpl) DetayGetir(id uint) (*dto.EtkinlikDTO, error) {
	e, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	return etkinlikDTO(e), nil
}

func (s *EtkinlikServiceImpl) Olustur(req *dto.EtkinlikOlusturIstegi) (*dto.EtkinlikDTO, error) {
	etkinlik := &entity.Etkinlik{
		Baslik:         req.Baslik,
		Aciklama:       req.Aciklama,
		GorselURL:      req.GorselURL,
		EtkinlikTarihi: req.EtkinlikTarihi,
		BaslangicSaati: req.BaslangicSaati,
		Kontenjan:      req.Kontenjan,
		Ucret:          req.Ucret,
	}
	if err := s.repo.Olustur(etkinlik); err != nil {
		return nil, err
	}
	return etkinlikDTO(etkinlik), nil
}

func (s *EtkinlikServiceImpl) Guncelle(id uint, req *dto.EtkinlikGuncelleIstegi) (*dto.EtkinlikDTO, error) {
	etkinlik, err := s.repo.IDileGetir(id)
	if err != nil {
		return nil, err
	}
	if req.Baslik != "" {
		etkinlik.Baslik = req.Baslik
	}
	if req.Aciklama != "" {
		etkinlik.Aciklama = req.Aciklama
	}
	if req.GorselURL != "" {
		etkinlik.GorselURL = req.GorselURL
	}
	if !req.EtkinlikTarihi.IsZero() {
		etkinlik.EtkinlikTarihi = req.EtkinlikTarihi
	}
	if req.BaslangicSaati != "" {
		etkinlik.BaslangicSaati = req.BaslangicSaati
	}
	if req.Kontenjan > 0 {
		etkinlik.Kontenjan = req.Kontenjan
	}
	if req.Ucret >= 0 {
		etkinlik.Ucret = req.Ucret
	}
	if err := s.repo.Guncelle(etkinlik); err != nil {
		return nil, err
	}
	return etkinlikDTO(etkinlik), nil
}

func (s *EtkinlikServiceImpl) Sil(id uint) error {
	if gorseller, err := s.repo.GorselleriListele(id); err == nil {
		for _, g := range gorseller {
			_ = upload.Sil(g.DosyaYolu)
		}
	}
	return s.repo.Sil(id)
}

// GorselleriYukle — multipart dosyalarını diske yazar, etkinlik_gorselleri
// tablosuna kaydeder ve etkinliğin ana görselini (gorsel_url) primary olana ayarlar.
func (s *EtkinlikServiceImpl) GorselleriYukle(etkinlikID uint, dosyalar []*multipart.FileHeader, primaryIndex int) ([]dto.GorselDTO, error) {
	etkinlik, err := s.repo.IDileGetir(etkinlikID)
	if err != nil {
		return nil, err
	}

	mevcut, _ := s.repo.GorselleriListele(etkinlikID)
	basSira := len(mevcut)
	primaryVarMi := false
	for _, g := range mevcut {
		if g.PrimaryMi {
			primaryVarMi = true
			break
		}
	}

	altKlasor := filepath.Join("etkinlikler", strconv.FormatUint(uint64(etkinlikID), 10))
	sonuc := make([]dto.GorselDTO, 0, len(dosyalar))

	for i, dosya := range dosyalar {
		if ok, mesaj := upload.GecerliMi(dosya); !ok {
			return nil, apperror.BadRequest(mesaj)
		}
		yol, err := upload.Kaydet(dosya, altKlasor)
		if err != nil {
			return nil, apperror.Internal("görsel kaydedilemedi", err)
		}
		primary := (!primaryVarMi && i == primaryIndex)
		g := &entity.EtkinlikGorseli{
			EtkinlikID: etkinlikID, DosyaYolu: yol,
			Sira: basSira + i, PrimaryMi: primary,
		}
		if err := s.repo.GorselEkle(g); err != nil {
			return nil, err
		}
		if primary {
			etkinlik.GorselURL = yol
			_ = s.repo.Guncelle(etkinlik)
		}
		sonuc = append(sonuc, dto.GorselDTO{
			ID: g.ID, URL: g.DosyaYolu, Sira: g.Sira, PrimaryMi: g.PrimaryMi,
		})
	}
	return sonuc, nil
}

func (s *EtkinlikServiceImpl) GorselSil(etkinlikID, gorselID uint) error {
	g, err := s.repo.GorselGetir(gorselID)
	if err != nil {
		return err
	}
	if g.EtkinlikID != etkinlikID {
		return apperror.BadRequest("görsel bu etkinliğe ait değil")
	}
	_ = upload.Sil(g.DosyaYolu)
	if err := s.repo.GorselSil(gorselID); err != nil {
		return err
	}
	if g.PrimaryMi {
		kalan, _ := s.repo.GorselleriListele(etkinlikID)
		if len(kalan) > 0 {
			kalan[0].PrimaryMi = true
			_ = s.repo.GorselGuncelle(kalan[0])
			if etkinlik, err := s.repo.IDileGetir(etkinlikID); err == nil {
				etkinlik.GorselURL = kalan[0].DosyaYolu
				_ = s.repo.Guncelle(etkinlik)
			}
		}
	}
	return nil
}

// ── Rezervasyon Service ───────────────────────────────────────────────────────

var _ domainsvc.RezervasyonService = (*RezervasyonServiceImpl)(nil)

type RezervasyonServiceImpl struct {
	repo         domainrepo.RezervasyonRepository
	etkinlikRepo domainrepo.EtkinlikRepository
	siparisRepo  domainrepo.SiparisRepository
}

func NewRezervasyonService(repo domainrepo.RezervasyonRepository, etkinlikRepo domainrepo.EtkinlikRepository, siparisRepo domainrepo.SiparisRepository) domainsvc.RezervasyonService {
	return &RezervasyonServiceImpl{repo, etkinlikRepo, siparisRepo}
}

func (s *RezervasyonServiceImpl) Olustur(kullaniciID uint, req *dto.RezervasyonOlusturIstegi) (*dto.RezervasyonDTO, error) {
	etkinlik, err := s.etkinlikRepo.IDileGetir(req.EtkinlikID)
	if err != nil {
		return nil, err
	}
	if etkinlik.Kontenjan < req.KatilimciSayisi {
		return nil, apperror.BadRequest("yeterli kontenjan yok")
	}

	// Rezervasyon oluştur
	rez := &entity.Rezervasyon{
		KullaniciID:     kullaniciID,
		EtkinlikID:      req.EtkinlikID,
		KatilimciSayisi: req.KatilimciSayisi,
		Durum:           "beklemede",
	}
	if err := s.repo.Olustur(rez); err != nil {
		return nil, err
	}

	// Otomatik sipariş oluştur
	toplam := etkinlik.Ucret * float64(req.KatilimciSayisi)
	siparis := &entity.Siparis{
		KullaniciID: kullaniciID,
		ToplamTutar: toplam,
		OdemYontemi: "beklemede",
		Durum:       "odeme_bekleniyor",
	}
	if err := s.siparisRepo.Olustur(siparis); err != nil {
		return nil, err
	}

	rez.Etkinlik = *etkinlik
	return rezervasyonDTO(rez), nil

}

func (s *RezervasyonServiceImpl) Listele(kullaniciID uint) ([]*dto.RezervasyonDTO, error) {
	liste, err := s.repo.KullaniciyaGoreListele(kullaniciID)
	if err != nil {
		return nil, err
	}
	result := make([]*dto.RezervasyonDTO, 0, len(liste))
	for _, r := range liste {
		result = append(result, rezervasyonDTO(r))
	}
	return result, nil
}

func (s *RezervasyonServiceImpl) Guncelle(kullaniciID, rezervasyonID uint, req *dto.RezervasyonGuncelleIstegi) (*dto.RezervasyonDTO, error) {
	rez, err := s.repo.IDileGetir(rezervasyonID)
	if err != nil {
		return nil, err
	}
	if rez.KullaniciID != kullaniciID {
		return nil, apperror.Forbidden("bu rezervasyon size ait değil")
	}
	if req.KatilimciSayisi > 0 {
		rez.KatilimciSayisi = req.KatilimciSayisi
	}
	if req.Durum != "" {
		rez.Durum = req.Durum
	}
	if err := s.repo.Guncelle(rez); err != nil {
		return nil, err
	}
	return rezervasyonDTO(rez), nil
}

func (s *RezervasyonServiceImpl) Iptal(kullaniciID, rezervasyonID uint) error {
	rez, err := s.repo.IDileGetir(rezervasyonID)
	if err != nil {
		return err
	}
	if rez.KullaniciID != kullaniciID {
		return apperror.Forbidden("bu rezervasyon size ait değil")
	}
	rez.Durum = "iptal"
	return s.repo.Guncelle(rez)
}

// ── Sipariş Service ───────────────────────────────────────────────────────────

var _ domainsvc.SiparisService = (*SiparisServiceImpl)(nil)

type SiparisServiceImpl struct {
	repo      domainrepo.SiparisRepository
	eserRepo  domainrepo.EserRepository
	kuponRepo domainrepo.KuponRepository
}

func NewSiparisService(repo domainrepo.SiparisRepository, eserRepo domainrepo.EserRepository, kuponRepo domainrepo.KuponRepository) domainsvc.SiparisService {
	return &SiparisServiceImpl{repo, eserRepo, kuponRepo}
}

func (s *SiparisServiceImpl) Olustur(kullaniciID uint, req *dto.SiparisOlusturIstegi) (*dto.SiparisDTO, error) {
	var toplam float64
	var detaylar []entity.SiparisDetay

	for _, eserID := range req.EserIDler {
		eser, err := s.eserRepo.IDileGetir(eserID)
		if err != nil {
			return nil, err
		}
		toplam += eser.Fiyat
		detaylar = append(detaylar, entity.SiparisDetay{EserID: eserID, BirimFiyat: eser.Fiyat})
	}

	if req.KuponKodu != "" {
		kupon, err := s.kuponRepo.KodileGetir(req.KuponKodu)
		if err == nil {
			indirim := toplam * (kupon.IndirimYuzdesi / 100)
			toplam -= indirim
		}
	}

	siparis := &entity.Siparis{
		KullaniciID: kullaniciID, ToplamTutar: toplam,
		OdemYontemi: req.OdemYontemi, Durum: "odeme_bekleniyor", Detaylar: detaylar,
	}
	if err := s.repo.Olustur(siparis); err != nil {
		return nil, err
	}
	return &dto.SiparisDTO{
		ID: siparis.ID, ToplamTutar: siparis.ToplamTutar,
		OdemYontemi: siparis.OdemYontemi, Durum: siparis.Durum,
		OlusturmaTarihi: siparis.OlusturmaTarihi,
	}, nil
}

func (s *SiparisServiceImpl) Listele(kullaniciID uint) ([]*dto.SiparisDTO, error) {
	liste, err := s.repo.KullaniciyaGoreListele(kullaniciID)
	if err != nil {
		return nil, err
	}
	result := make([]*dto.SiparisDTO, 0, len(liste))
	for _, sp := range liste {
		result = append(result, &dto.SiparisDTO{
			ID: sp.ID, ToplamTutar: sp.ToplamTutar,
			OdemYontemi: sp.OdemYontemi, Durum: sp.Durum,
			OlusturmaTarihi: sp.OlusturmaTarihi,
		})
	}
	return result, nil
}

func (s *SiparisServiceImpl) DetayGetir(kullaniciID, siparisID uint) (*dto.SiparisDTO, error) {
	sp, err := s.repo.IDileGetir(siparisID)
	if err != nil {
		return nil, err
	}
	if sp.KullaniciID != kullaniciID {
		return nil, apperror.Forbidden("bu sipariş size ait değil")
	}
	return &dto.SiparisDTO{
		ID: sp.ID, ToplamTutar: sp.ToplamTutar,
		OdemYontemi: sp.OdemYontemi, Durum: sp.Durum,
		OlusturmaTarihi: sp.OlusturmaTarihi,
	}, nil
}

// ── Favori Service ────────────────────────────────────────────────────────────

var _ domainsvc.FavoriService = (*FavoriServiceImpl)(nil)

type FavoriServiceImpl struct {
	repo     domainrepo.FavoriRepository
	eserRepo domainrepo.EserRepository
}

func NewFavoriService(repo domainrepo.FavoriRepository, eserRepo domainrepo.EserRepository) domainsvc.FavoriService {
	return &FavoriServiceImpl{repo, eserRepo}
}

func (s *FavoriServiceImpl) Ekle(kullaniciID uint, req *dto.FavoriEkleIstegi) error {
	varMi, _ := s.repo.VarMi(kullaniciID, req.EserID)
	if varMi {
		return apperror.Conflict("bu eser zaten favorilerinizde")
	}
	return s.repo.Ekle(&entity.Favori{KullaniciID: kullaniciID, EserID: req.EserID})
}

func (s *FavoriServiceImpl) Kaldir(kullaniciID, eserID uint) error {
	return s.repo.Kaldir(kullaniciID, eserID)
}

func (s *FavoriServiceImpl) Listele(kullaniciID uint) ([]*dto.EserDTO, error) {
	favoriler, err := s.repo.KullaniciyaGoreListele(kullaniciID)
	if err != nil {
		return nil, err
	}
	result := make([]*dto.EserDTO, 0, len(favoriler))
	for _, f := range favoriler {
		result = append(result, eserDTO(&f.Eser))
	}
	return result, nil
}

// ── Yorum Service ─────────────────────────────────────────────────────────────

var _ domainsvc.YorumService = (*YorumServiceImpl)(nil)

type YorumServiceImpl struct {
	repo            domainrepo.YorumRepository
	rezervasyonRepo domainrepo.RezervasyonRepository
	siparisRepo     domainrepo.SiparisRepository
}

func NewYorumService(repo domainrepo.YorumRepository, rezervasyonRepo domainrepo.RezervasyonRepository, siparisRepo domainrepo.SiparisRepository) domainsvc.YorumService {
	return &YorumServiceImpl{repo, rezervasyonRepo, siparisRepo}
}

func (s *YorumServiceImpl) Ekle(kullaniciID uint, req *dto.YorumEkleIstegi) (*dto.YorumDTO, error) {
	// Etkinlik yorumu için katılım kontrolü
	if req.ReferansTipi == "etkinlik" {
		rezervasyonlar, err := s.rezervasyonRepo.KullaniciyaGoreListele(kullaniciID)
		if err != nil {
			return nil, err
		}
		katildiMi := false
		for _, r := range rezervasyonlar {
			if r.EtkinlikID == req.ReferansID && r.Durum != "iptal" {
				katildiMi = true
				break
			}
		}
		if !katildiMi {
			return nil, apperror.Forbidden("bu etkinliğe katilmadan yorum yapamazsiniz")
		}
	}

	// Eser yorumu için satın alma kontrolü
	if req.ReferansTipi == "eser" {
		siparisler, err := s.siparisRepo.KullaniciyaGoreListele(kullaniciID)
		if err != nil {
			return nil, err
		}
		satingAldiMi := false
		for _, s := range siparisler {
			for _, d := range s.Detaylar {
				if d.EserID == req.ReferansID {
					satingAldiMi = true
					break
				}
			}
		}
		if !satingAldiMi {
			return nil, apperror.Forbidden("bu eseri satın almadan yorum yapamazsınız")
		}
	}

	yorum := &entity.Yorum{
		KullaniciID:   kullaniciID,
		ReferansID:    req.ReferansID,
		ReferansTipi:  req.ReferansTipi,
		Puan:          req.Puan,
		Metin:         req.Metin,
		DogrulanmisMi: true,
	}
	if err := s.repo.Ekle(yorum); err != nil {
		return nil, err
	}
	return &dto.YorumDTO{
		ID: yorum.ID, Puan: yorum.Puan, Metin: yorum.Metin,
		DogrulanmisMi:   yorum.DogrulanmisMi,
		OlusturmaTarihi: yorum.OlusturmaTarihi,
	}, nil
}

func (s *YorumServiceImpl) Listele(referansID uint, referansTipi string, siralama string) (*dto.YorumListeCevabi, error) {
	yorumlar, err := s.repo.ReferansaGoreListele(referansID, referansTipi, siralama)
	if err != nil {
		return nil, err
	}

	ortalama, toplam, _ := s.repo.OrtalamaPuanGetir(referansID, referansTipi)

	result := make([]*dto.YorumDTO, 0, len(yorumlar))
	for _, y := range yorumlar {
		yanitlar := make([]dto.YorumYanitiDTO, 0, len(y.Yanitlar))
		for _, yn := range y.Yanitlar {
			yanitlar = append(yanitlar, dto.YorumYanitiDTO{
				ID:              yn.ID,
				YanitMetni:      yn.YanitMetni,
				OlusturmaTarihi: yn.OlusturmaTarihi,
			})
		}
		result = append(result, &dto.YorumDTO{
			ID: y.ID, Puan: y.Puan, Metin: y.Metin,
			FaydalıOySayisi: y.FaydalıOySayisi, DogrulanmisMi: y.DogrulanmisMi,
			OlusturmaTarihi: y.OlusturmaTarihi,
			Kullanici:       kullaniciDTO(&y.Kullanici),
			Yanitlar:        yanitlar,
		})
	}

	return &dto.YorumListeCevabi{
		OrtalamaPuan: ortalama,
		ToplamYorum:  toplam,
		Yorumlar:     result,
	}, nil
}

func (s *YorumServiceImpl) FaydaliBul(yorumID uint) error {
	return s.repo.FaydaliBul(yorumID)
}

func (s *YorumServiceImpl) PuanVer(yorumID, kullaniciID uint, req *dto.YorumPuanIstegi) error {
	return s.repo.PuanVer(yorumID, kullaniciID, req.Puan)
}

func (s *YorumServiceImpl) YanitEkle(yoneticiID, yorumID uint, req *dto.YanitEkleIstegi) error {
	return s.repo.YanitEkle(&entity.YorumYaniti{
		YorumID: yorumID, YoneticiID: yoneticiID, YanitMetni: req.YanitMetni,
	})
}

func (s *YorumServiceImpl) Sil(yorumID uint) error {
	if _, err := s.repo.IDileGetir(yorumID); err != nil {
		return err
	}
	return s.repo.Sil(yorumID)
}

// ── Destek Service ────────────────────────────────────────────────────────────

var _ domainsvc.DestekService = (*DestekServiceImpl)(nil)

type DestekServiceImpl struct{ repo domainrepo.DestekRepository }

func NewDestekService(repo domainrepo.DestekRepository) domainsvc.DestekService {
	return &DestekServiceImpl{repo}
}

func (s *DestekServiceImpl) Olustur(kullaniciID uint, req *dto.DestekTalebiOlusturIstegi) (*dto.DestekTalebiDTO, error) {
	talep := &entity.DestekTalebi{
		KullaniciID: kullaniciID, Konu: req.Konu, Mesaj: req.Mesaj, Durum: "acik",
	}
	if err := s.repo.Olustur(talep); err != nil {
		return nil, err
	}
	return &dto.DestekTalebiDTO{
		ID: talep.ID, Konu: talep.Konu, Mesaj: talep.Mesaj,
		Durum: talep.Durum, OlusturmaTarihi: talep.OlusturmaTarihi,
	}, nil
}

func (s *DestekServiceImpl) Listele(kullaniciID uint) ([]*dto.DestekTalebiDTO, error) {
	liste, err := s.repo.KullaniciyaGoreListele(kullaniciID)
	if err != nil {
		return nil, err
	}
	result := make([]*dto.DestekTalebiDTO, 0, len(liste))
	for _, d := range liste {
		result = append(result, &dto.DestekTalebiDTO{
			ID: d.ID, Konu: d.Konu, Mesaj: d.Mesaj,
			Durum: d.Durum, OlusturmaTarihi: d.OlusturmaTarihi,
		})
	}
	return result, nil
}

// ── Destek Mesaj Service ──────────────────────────────────────────────────────

var _ domainsvc.DestekMesajService = (*DestekMesajServiceImpl)(nil)

type DestekMesajServiceImpl struct {
	repo          domainrepo.DestekMesajRepository
	destekRepo    domainrepo.DestekRepository
	kullaniciRepo domainrepo.KullaniciRepository
}

func NewDestekMesajService(
	repo domainrepo.DestekMesajRepository,
	destekRepo domainrepo.DestekRepository,
	kullaniciRepo domainrepo.KullaniciRepository,
) domainsvc.DestekMesajService {
	return &DestekMesajServiceImpl{repo, destekRepo, kullaniciRepo}
}

func (s *DestekMesajServiceImpl) MesajGonder(kullaniciID, talepID uint, req *dto.DestekMesajGonderIstegi) (*dto.DestekMesajDTO, error) {
	// Talep var mı kontrol et
	_, err := s.destekRepo.IDileGetir(talepID)
	if err != nil {
		return nil, err
	}

	// Gönderenin rolünü kontrol et
	gonderenTipi := "kullanici"
	user, err := s.kullaniciRepo.IDileGetir(kullaniciID)
	if err == nil && user != nil && user.Rol == "admin" {
		gonderenTipi = "admin"
	}

	mesaj := &entity.DestekMesaj{
		TalepID:      talepID,
		GonderenID:   kullaniciID,
		Mesaj:        req.Mesaj,
		GonderenTipi: gonderenTipi,
	}

	if err := s.repo.Gonder(mesaj); err != nil {
		return nil, err
	}

	return &dto.DestekMesajDTO{
		ID:              mesaj.ID,
		Mesaj:           mesaj.Mesaj,
		GonderenTipi:    mesaj.GonderenTipi,
		OlusturmaTarihi: mesaj.OlusturmaTarihi,
	}, nil
}

func (s *DestekMesajServiceImpl) MesajlariGetir(talepID uint) ([]*dto.DestekMesajDTO, error) {
	mesajlar, err := s.repo.TalepeMesajlariGetir(talepID)
	if err != nil {
		return nil, err
	}

	result := make([]*dto.DestekMesajDTO, 0, len(mesajlar))
	for _, m := range mesajlar {
		result = append(result, &dto.DestekMesajDTO{
			ID:              m.ID,
			Mesaj:           m.Mesaj,
			GonderenTipi:    m.GonderenTipi,
			OlusturmaTarihi: m.OlusturmaTarihi,
			Gonderen:        kullaniciDTO(&m.Gonderen),
		})
	}
	return result, nil
}

// ── Karşılaştırma Service ─────────────────────────────────────────────────────

var _ domainsvc.KarsilastirmaService = (*KarsilastirmaServiceImpl)(nil)

type KarsilastirmaServiceImpl struct {
	eserRepo        domainrepo.EserRepository
	etkinlikRepo    domainrepo.EtkinlikRepository
	karsilastirRepo domainrepo.KarsilastirmaRepository
}

func NewKarsilastirmaService(
	eserRepo domainrepo.EserRepository,
	etkinlikRepo domainrepo.EtkinlikRepository,
	karsilastirRepo domainrepo.KarsilastirmaRepository,
) domainsvc.KarsilastirmaService {
	return &KarsilastirmaServiceImpl{eserRepo, etkinlikRepo, karsilastirRepo}
}

func (s *KarsilastirmaServiceImpl) EserleriKarsilastir(kullaniciID uint, req *dto.EserKarsilastirIstegi) (*dto.EserKarsilastirSonucu, error) {
	eserler := make([]*dto.EserDTO, 0, len(req.EserIDler))

	for _, id := range req.EserIDler {
		eser, err := s.eserRepo.IDileGetir(id)
		if err != nil {
			return nil, err
		}
		eserler = append(eserler, eserDTO(eser))
	}

	// Sonucu kaydet
	if req.Kaydet {
		liste := &entity.KarsilastirmaListesi{
			KullaniciID: kullaniciID,
			ListeAdi:    "Eser Karşılaştırması",
		}
		if err := s.karsilastirRepo.ListeOlustur(liste); err != nil {
			return nil, err
		}
		for _, id := range req.EserIDler {
			s.karsilastirRepo.OgeEkle(&entity.KarsilastirmaOgesi{
				KarsilastirmaID: liste.ID,
				ReferansID:      id,
				ReferansTipi:    "eser",
			})
		}
	}

	return &dto.EserKarsilastirSonucu{Eserler: eserler}, nil
}

func (s *KarsilastirmaServiceImpl) EtkinlikleriKarsilastir(kullaniciID uint, req *dto.EtkinlikKarsilastirIstegi) (*dto.EtkinlikKarsilastirSonucu, error) {
	etkinlikler := make([]*dto.EtkinlikDTO, 0, len(req.EtkinlikIDler))

	for _, id := range req.EtkinlikIDler {
		etkinlik, err := s.etkinlikRepo.IDileGetir(id)
		if err != nil {
			return nil, err
		}
		etkinlikler = append(etkinlikler, etkinlikDTO(etkinlik))
	}

	// Sonucu kaydet
	if req.Kaydet {
		liste := &entity.KarsilastirmaListesi{
			KullaniciID: kullaniciID,
			ListeAdi:    "Etkinlik Karşılaştırması",
		}
		if err := s.karsilastirRepo.ListeOlustur(liste); err != nil {
			return nil, err
		}
		for _, id := range req.EtkinlikIDler {
			s.karsilastirRepo.OgeEkle(&entity.KarsilastirmaOgesi{
				KarsilastirmaID: liste.ID,
				ReferansID:      id,
				ReferansTipi:    "etkinlik",
			})
		}
	}

	return &dto.EtkinlikKarsilastirSonucu{Etkinlikler: etkinlikler}, nil
}

// ── İstatistik Service ────────────────────────────────────────────────────────

var _ domainsvc.IstatistikService = (*IstatistikServiceImpl)(nil)

type IstatistikServiceImpl struct {
	db *gorm.DB
}

func NewIstatistikService(db *gorm.DB) domainsvc.IstatistikService {
	return &IstatistikServiceImpl{db}
}

func (s *IstatistikServiceImpl) EserIstatistigi(eserID uint) (*dto.EserIstatistikDTO, error) {
	var eser entity.Eser
	if err := s.db.First(&eser, eserID).Error; err != nil {
		return nil, apperror.NotFound("eser bulunamadı")
	}

	var toplamFavori int64
	s.db.Model(&entity.Favori{}).Where("eser_id = ?", eserID).Count(&toplamFavori)

	var toplamYorum int64
	s.db.Model(&entity.Yorum{}).Where("referans_id = ? AND referans_tipi = ?", eserID, "eser").Count(&toplamYorum)

	var ortalamaPuan float64
	s.db.Model(&entity.Yorum{}).
		Select("COALESCE(AVG(puan), 0)").
		Where("referans_id = ? AND referans_tipi = ?", eserID, "eser").
		Scan(&ortalamaPuan)

	return &dto.EserIstatistikDTO{
		EserID:       eserID,
		Baslik:       eser.Baslik,
		ToplamFavori: toplamFavori,
		ToplamYorum:  toplamYorum,
		OrtalamaPuan: ortalamaPuan,
	}, nil
}

func (s *IstatistikServiceImpl) EtkinlikIstatistigi(etkinlikID uint) (*dto.EtkinlikIstatistikDTO, error) {
	var etkinlik entity.Etkinlik
	if err := s.db.First(&etkinlik, etkinlikID).Error; err != nil {
		return nil, apperror.NotFound("etkinlik bulunamadı")
	}

	var toplamRezervasyon int64
	s.db.Model(&entity.Rezervasyon{}).
		Where("etkinlik_id = ? AND durum != ?", etkinlikID, "iptal").
		Count(&toplamRezervasyon)

	var ortalamaPuan float64
	s.db.Model(&entity.Yorum{}).
		Select("COALESCE(AVG(puan), 0)").
		Where("referans_id = ? AND referans_tipi = ?", etkinlikID, "etkinlik").
		Scan(&ortalamaPuan)

	dolulukOrani := 0.0
	if etkinlik.Kontenjan > 0 {
		dolulukOrani = float64(toplamRezervasyon) / float64(etkinlik.Kontenjan) * 100
	}

	return &dto.EtkinlikIstatistikDTO{
		EtkinlikID:        etkinlikID,
		Baslik:            etkinlik.Baslik,
		ToplamRezervasyon: toplamRezervasyon,
		DolulukOrani:      dolulukOrani,
		OrtalamaPuan:      ortalamaPuan,
	}, nil
}

func (s *IstatistikServiceImpl) AdminRapor() (*dto.AdminRaporDTO, error) {
	var toplamKullanici, toplamSiparis, toplamRezervasyon, toplamEser, toplamEtkinlik int64
	var toplamGelir, ortalamaPuan float64

	s.db.Model(&entity.User{}).Count(&toplamKullanici)
	s.db.Model(&entity.Siparis{}).Count(&toplamSiparis)
	s.db.Model(&entity.Rezervasyon{}).Count(&toplamRezervasyon)
	s.db.Model(&entity.Eser{}).Count(&toplamEser)
	s.db.Model(&entity.Etkinlik{}).Count(&toplamEtkinlik)

	s.db.Model(&entity.Siparis{}).Select("COALESCE(SUM(toplam_tutar), 0)").Scan(&toplamGelir)
	s.db.Model(&entity.Yorum{}).Select("COALESCE(AVG(puan), 0)").Scan(&ortalamaPuan)

	return &dto.AdminRaporDTO{
		ToplamKullanici:   toplamKullanici,
		ToplamSiparis:     toplamSiparis,
		ToplamRezervasyon: toplamRezervasyon,
		ToplamEser:        toplamEser,
		ToplamEtkinlik:    toplamEtkinlik,
		ToplamGelir:       toplamGelir,
		OrtalamaPuan:      ortalamaPuan,
	}, nil
}

// ── Kampanya Service ──────────────────────────────────────────────────────────

var _ domainsvc.KampanyaService = (*KampanyaServiceImpl)(nil)

type KampanyaServiceImpl struct {
	db        *gorm.DB
	kuponRepo domainrepo.KuponRepository
}

func NewKampanyaService(db *gorm.DB, kuponRepo domainrepo.KuponRepository) domainsvc.KampanyaService {
	return &KampanyaServiceImpl{db, kuponRepo}
}

func (s *KampanyaServiceImpl) KampanyaliEserleriListele() ([]*dto.KampanyaDTO, error) {
	var eserler []entity.Eser
	// Stok adedi 0'dan büyük ve fiyatı düşük olanları kampanyalı say
	if err := s.db.Preload("Sanatci").Where("stok_adedi > 0").
		Order("fiyat ASC").Limit(10).Find(&eserler).Error; err != nil {
		return nil, apperror.Internal("kampanyalı eserler getirilemedi", err)
	}

	result := make([]*dto.KampanyaDTO, 0, len(eserler))
	for _, e := range eserler {
		result = append(result, &dto.KampanyaDTO{
			EserID:         e.ID,
			Baslik:         e.Baslik,
			Fiyat:          e.Fiyat,
			IndirimYuzdesi: 0,
		})
	}
	return result, nil
}

func (s *KampanyaServiceImpl) KullaniciyaOzelFirsatlar(kullaniciID uint) ([]*dto.OzelFirsatDTO, error) {
	// Aktif kuponları getir
	var kuponlar []entity.Kupon
	if err := s.db.Where("aktif_mi = true").Find(&kuponlar).Error; err != nil {
		return nil, apperror.Internal("fırsatlar getirilemedi", err)
	}

	result := make([]*dto.OzelFirsatDTO, 0, len(kuponlar))
	for _, k := range kuponlar {
		result = append(result, &dto.OzelFirsatDTO{
			KuponKodu:        k.Kod,
			IndirimYuzdesi:   k.IndirimYuzdesi,
			GecerlilikTarihi: k.GecerlilikTarihi.Format("2006-01-02"),
		})
	}
	return result, nil
}

// ── Admin Service ─────────────────────────────────────────────────────────────

var _ domainsvc.AdminService = (*AdminServiceImpl)(nil)

type AdminServiceImpl struct {
	repo domainrepo.AdminRepository
}

func NewAdminService(repo domainrepo.AdminRepository) domainsvc.AdminService {
	return &AdminServiceImpl{repo}
}

func (s *AdminServiceImpl) TumSiparisleri() ([]*dto.SiparisDTO, error) {
	liste, err := s.repo.TumSiparisleri()
	if err != nil {
		return nil, err
	}
	result := make([]*dto.SiparisDTO, 0, len(liste))
	for _, sp := range liste {
		result = append(result, &dto.SiparisDTO{
			ID: sp.ID, ToplamTutar: sp.ToplamTutar,
			OdemYontemi: sp.OdemYontemi, Durum: sp.Durum,
			OlusturmaTarihi: sp.OlusturmaTarihi,
		})
	}
	return result, nil
}

func (s *AdminServiceImpl) TumRezervasyonlari() ([]*dto.RezervasyonDTO, error) {
	liste, err := s.repo.TumRezervasyonlari()
	if err != nil {
		return nil, err
	}
	result := make([]*dto.RezervasyonDTO, 0, len(liste))
	for _, r := range liste {
		result = append(result, rezervasyonDTO(r))
	}
	return result, nil
}

func (s *AdminServiceImpl) TumDestekTaleplerini() ([]*dto.DestekTalebiDTO, error) {
	liste, err := s.repo.TumDestekTaleplerini()
	if err != nil {
		return nil, err
	}
	result := make([]*dto.DestekTalebiDTO, 0, len(liste))
	for _, d := range liste {
		uDTO := kullaniciDTO(&d.Kullanici)
		result = append(result, &dto.DestekTalebiDTO{
			ID: d.ID, KullaniciID: d.KullaniciID, Kullanici: &uDTO, Konu: d.Konu, Mesaj: d.Mesaj,
			Durum: d.Durum, OlusturmaTarihi: d.OlusturmaTarihi,
		})
	}
	return result, nil
}

func (s *AdminServiceImpl) TumKullanicilari() ([]*dto.KullaniciDTO, error) {
	liste, err := s.repo.TumKullanicilari()
	if err != nil {
		return nil, err
	}
	result := make([]*dto.KullaniciDTO, 0, len(liste))
	for _, u := range liste {
		d := kullaniciDTO(u)
		result = append(result, &d)
	}
	return result, nil
}
