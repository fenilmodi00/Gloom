.PHONY: run build test migrate-up migrate-down sqlc

run:
	go run cmd/server/main.go

build:
	go build -o bin/server cmd/server/main.go

test:
	go test -v ./...

migrate-up:
	migrate -path migrations -database "${DATABASE_URL}" -verbose up

migrate-down:
	migrate -path migrations -database "${DATABASE_URL}" -verbose down

sqlc:
	sqlc generate
