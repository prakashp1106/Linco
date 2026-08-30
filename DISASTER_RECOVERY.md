# LINCO Disaster Recovery Plan (DRP)

## Recovery Objectives
- **Recovery Point Objective (RPO)**: < 1 hour (Automated Firestore daily exports + incremental point-in-time logging).
- **Recovery Time Objective (RTO)**: < 15 minutes (Containerized Cloud Run instant redeployment + automated GCS restore).

## Infrastructure Redundancy
- **Compute**: Google Cloud Run (Serverless, multi-zone automated scaling and auto-healing).
- **Database**: Cloud Firestore in Multi-Region (asia-south1 / asia-south2 redundancy).
- **Static Assets & Images**: Cloudinary multi-CDN + local fallback serving.
- **Failover / Rollback**: Instant Cloud Run revision traffic splitting to previous healthy revision tag.
