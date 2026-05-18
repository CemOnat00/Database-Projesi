package middleware

import (
	"strings"

	"github.com/bscc/go-backend/internal/pkg/apperror"
	"github.com/bscc/go-backend/internal/pkg/jwt"
	"github.com/bscc/go-backend/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

func GirisGerekli(jwtManager *jwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, apperror.Unauthorized("token bulunamadı"))
			c.Abort()
			return
		}

		parcalar := strings.SplitN(authHeader, " ", 2)
		if len(parcalar) != 2 || !strings.EqualFold(parcalar[0], "bearer") {
			response.Error(c, apperror.Unauthorized("geçersiz token formatı"))
			c.Abort()
			return
		}

		claims, err := jwtManager.Validate(parcalar[1])
		if err != nil {
			response.Error(c, apperror.Unauthorized("token geçersiz veya süresi dolmuş"))
			c.Abort()
			return
		}

		c.Set("kullaniciID", claims.UserID)
		c.Set("kullaniciEmail", claims.Email)
		c.Set("kullaniciRol", claims.Role)
		c.Next()
	}
}

func RolGerekli(rol string) gin.HandlerFunc {
	return func(c *gin.Context) {
		kullaniciRol, _ := c.Get("kullaniciRol")
		if kullaniciRol.(string) != rol {
			response.Error(c, apperror.Forbidden("bu işlem için yetkiniz yok"))
			c.Abort()
			return
		}
		c.Next()
	}
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin,Content-Type,Authorization,Accept")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
