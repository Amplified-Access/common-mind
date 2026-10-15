package handlers

import (
	"net/http"

	"backend/internal/infrastructure/ws"
	"backend/internal/usecase"
)

// Handler holds all use case dependencies for HTTP handlers.
type Handler struct {
	healthUC       usecase.HealthUseCase
	verifier       usecase.FirebaseTokenVerifier // nil disables auth (dev only)
	hub            *ws.Hub
	enqueuer       usecase.Enqueuer       // nil when REDIS_URL is not set
	queueUI        http.Handler           // nil disables /admin/queues route
	emailSender    usecase.EmailSender    // nil when MAILJET_API_KEY is not set
	streamProducer usecase.StreamProducer // nil when REDIS_URL is not set
	userRepo       usecase.UserRepository // nil when not wired
	dataLab        usecase.DataLab
}

// NewHandler constructs a Handler with all required use cases.
func NewHandler(
	healthUC usecase.HealthUseCase,
	verifier usecase.FirebaseTokenVerifier,
	hub *ws.Hub,
	enqueuer usecase.Enqueuer,
	queueUI http.Handler,
	emailSender usecase.EmailSender,
	streamProducer usecase.StreamProducer,
	userRepo usecase.UserRepository,
	dataLab usecase.DataLab,
) *Handler {
	return &Handler{
		healthUC:       healthUC,
		verifier:       verifier,
		hub:            hub,
		enqueuer:       enqueuer,
		queueUI:        queueUI,
		emailSender:    emailSender,
		streamProducer: streamProducer,
		userRepo:       userRepo,
		dataLab:        dataLab,
	}
}
