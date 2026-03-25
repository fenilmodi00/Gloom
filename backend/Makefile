.PHONY: run build test migrate-up migrate-down sqlc

run:
	go run cmd/server/main.go

build:
	go build -o bin/server cmd/server/main.go

test:
	go test -v ./...

migrate-up:
	# Requires golang-migrate CLI
	# migrate -path migrations -database "${DATABASE_URL}" up

migrate-down:
	# Requires golang-migrate CLI
	# migrate -path migrations -database "${DATABASE_URL}" down

sqlc:
	# sqlc generate
