# Development JWT Token Guide for StyleAI

This document explains how to generate and use a development JWT token to bypass authentication in StyleAI during development.

## How JWT Authentication Works in StyleAI

StyleAI uses JWT (JSON Web Token) validation for authenticating API requests. The authentication middleware (`backend/internal/middleware/auth.go`) validates tokens using:

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: `SUPABASE_JWT_SECRET` from environment variables
- **Required Claim**: `sub` (subject) containing a user UUID string

When a request includes an `Authorization: Bearer <token>` header:
1. The token is parsed and verified using the HS256 algorithm with `SUPABASE_JWT_SECRET`
2. The `sub` claim is extracted and validated as a UUID
3. If valid, the user ID is stored in the request context for downstream handlers

## Development Bypass Mechanisms

StyleAI includes built-in development bypasses when `GO_ENV=development` is set:

### 1. Missing Authorization Header
If no `Authorization` header is present, the middleware automatically uses a default user ID:
```
00000000-0000-0000-0000-000000000000
```

### 2. Invalid or Missing `sub` Claim
If the token is present but:
- Missing `sub` claim, OR
- Empty `sub` claim (`""`)

...and `GO_ENV=development`, the same default user ID is used.

This means in development, you can bypass auth by either:
- Not sending an Authorization header, OR
- Sending a token with missing/empty `sub` claim

## Generating a Development JWT Token

While the built-in bypasses work for many cases, you may want to test with a valid JWT token that mimics a real Supabase token. Here's how to generate one:

### Option 1: Using jwt.io (Recommended for Quick Testing)

1. Go to [https://jwt.io](https://jwt.io)
2. Set the algorithm to **HS256**
3. In the **Payload** section, add:
   ```json
   {
     "sub": "00000000-0000-0000-0000-000000000000",
     "exp": 9999999999
   }
   ```
   - `sub`: Use the default development UUID (or any valid UUID)
   - `exp`: Set a far-future expiration timestamp (9999999999 = year 2286)
4. In the **Verify Signature** section, enter your `SUPABASE_JWT_SECRET` from `.env`
5. The generated token will appear in the **Encoded** section

### Option 2: Using a Go Script

Create a file `dev-token.go`:

```go
package main

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func main() {
	// Get secret from environment (or hardcode for dev only)
	jwtSecret := "4IV24tKwCoGL2pHE3ubirt4QNMQKJOD6tZLEGJLWYYbauMJLEzvaPnXIMdmAyvQ29dFAkmuRn+WtsDpuVXFr1A==" // From .env

	// Create token with default dev user ID and far-future expiration
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["sub"] = "00000000-0000-0000-0000-000000000000"
	claims["exp"] = time.Now().Add(time.Hour * 24 * 365 * 10).Unix() // 10 years

	// Sign token
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		fmt.Printf("Error signing token: %v\n", err)
		return
	}

	fmt.Printf("Development JWT Token:\n%s\n", tokenString)
	fmt.Printf("\nAdd to frontend .env as:\nEXPO_PUBLIC_DEV_JWT_TOKEN=%s\n", tokenString)
}
```

Then run:
```bash
go run dev-token.go
```

### Option 3: Using Supabase CLI (If Available)

If you have Supabase CLI configured:
```bash
supabase functions jwt-sign \
  --secret "$SUPABASE_JWT_SECRET" \
  --claims '{"sub":"00000000-0000-0000-0000-000000000000","exp":9999999999}'
```

## Where to Store the Dev Token

For frontend usage (Expo/React Native), add the generated token to your frontend `.env` file:

```
# Frontend .env (in StyleAI/ directory)
EXPO_PUBLIC_DEV_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJleHAiOjk5OTk5OTk5OX0.XXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Then in your frontend code, use it when making API requests:
```javascript
const devToken = process.env.EXPO_PUBLIC_DEV_JWT_TOKEN;
// Use in Authorization header: `Bearer ${devToken}`
```

## Important Notes

1. **Security**: Never commit actual tokens to version control. The `.env` file should be in `.gitignore`.
2. **Environment**: These development bypasses only work when `GO_ENV=development` is set in the backend `.env`.
3. **Production**: In production (`GO_ENV=production`), all bypasses are disabled and valid Supabase JWT tokens are required.
4. **Token Format**: The token must be a standard JWT with three parts separated by dots: `header.payload.signature`.
5. **Default User**: When using the development bypasses or a dev token with the default UUID, the backend will treat you as user ID `00000000-0000-0000-0000-000000000000`.

## Summary

For development, you have three options to bypass authentication:
1. **No token**: Don't send Authorization header (simplest)
2. **Invalid token**: Send token with missing/empty `sub` claim
3. **Valid dev token**: Generate a properly signed JWT with valid claims

Options 1 and 2 require no token generation and leverage the built-in bypasses. Option 3 gives you a realistic token that matches the format of production Supabase tokens, useful for testing edge cases or frontend logic that expects a valid JWT structure.
