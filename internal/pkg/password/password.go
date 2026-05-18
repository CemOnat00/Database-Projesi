package password

import "golang.org/x/crypto/bcrypt"

// Hash — şifreyi güvenli hale getirir
// Kullanıcı kayıt olunca şifre veritabanına bu şekilde kaydedilir
// Örnek: "123456" → "$2a$12$xyz..."
func Hash(plaintext string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plaintext), 12)
	return string(bytes), err
}

// Check — girilen şifre ile kayıtlı hash eşleşiyor mu?
// Kullanıcı giriş yapınca kontrol edilir
// Örnek: "123456" ile "$2a$12$xyz..." eşleşiyor mu?
func Check(plaintext, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plaintext)) == nil
}
